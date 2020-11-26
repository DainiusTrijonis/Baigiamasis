import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as puppeteer from 'puppeteer';
const serviceAccount = require("../ServiceKeyAccount.json");

class Product {
  name: string;
  photoURL: string;
  date: number;
  constructor (name:string,photoURL:string, date:number) {
    this.name = name;
    this.photoURL = photoURL
    this.date = date;
  }
}
const productConverter = {
  toFirestore: function(product:Product) {
      return {
        name: product.name,
        photoURL: product.photoURL,
        date: product.date,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new Product(data.name, data.photoURL, data.date);
  },
}
 
class ECommerce {
  shopName: string;
  shopLogoURL: string;
  productName: string;
  lowestPrice: number;
  photoURL: string;
  href: string;
  constructor (shopName:string, shopLogoURL:string, productName:string, lowestPrice:number, photoURL:string, href:string) {
      this.shopName = shopName;
      this.shopLogoURL = shopLogoURL;
      this.productName = productName;
      this.lowestPrice = lowestPrice;
      this.photoURL = photoURL;
      this.href = href;
  }
}

const eCommerceConverter = {
  toFirestore: function(eCommerce:ECommerce) {
      return {
        shopName: eCommerce.shopName,
        shopLogoURL: eCommerce.shopLogoURL,
        productName: eCommerce.productName,
        lowestPrice: eCommerce.lowestPrice,
        photoURL: eCommerce.photoURL,
        href: eCommerce.href,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new ECommerce(data.shopName, data.shopLogoURL, data.productName, data.lowestPrice, data.photoURL, data.href);
  },
}


admin.initializeApp({
 credential: admin.credential.cert(serviceAccount),
});

export const checkPrice = functions.runWith({memory:'2GB'}).https.onRequest(async (request, response) => {
  const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
  const boolean:Boolean = await getSenukaiProduct("Intel Core i5-10600K",'').then((eCommerce:ECommerce) => {
    const product:Product = {name: eCommerce.productName, photoURL:eCommerce.photoURL, date:admin.firestore.Timestamp.now().seconds }
    if(eCommerce.href !== '') {
      return admin.firestore().collection('product').add(product).then((doc) => {
        return doc.collection('ECommerce').doc(eCommerce.shopName).set(eCommerce).then(async () => {
          console.log("Finish set function for Senukai");
          await getAmazonProduct(product.name,'').then((eCommerceA:ECommerce) => {
            doc.collection('ECommerce').doc(eCommerceA.shopName).set(eCommerceA).then( ()=>{
              browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
              console.log("Finish set function for Amazon")
            }).catch((error) => {   
              browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
              console.log(error)
            })
          })

          return true;
        }).catch((error) => {
          console.log(error);
          browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
          return false;
        });
      }).catch((error) => {
        console.log(error);
        browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
        return false;
      }) 
    }
    else {
      console.log("Wrong href")
      browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
      return false;
    }
  }).catch((error) => {
    console.log(error)
    browser.close().then(()=>{console.log("closed browser")}).catch((err)=>{console.log(err)});
    return false;
  });
  console.log(boolean);
  response.send(boolean);

});


export const updateProducts = functions.runWith({memory:'2GB'}).https.onRequest( (request, response) => {
  const time = admin.firestore.Timestamp.now().seconds-60;
  Promise.all([
    admin.firestore().collection('product').where('date','<',time).limit(2).withConverter(productConverter).get().then((querySnapshot)=>{
      let array:FirebaseFirestore.QueryDocumentSnapshot<Product>[] =[] 
      querySnapshot.forEach(doc => {
         array.push(doc);
         let product:Product = doc.data();
         product.date = admin.firestore.Timestamp.now().seconds;
         doc.ref.set(product).then(() => {
           console.log('set new time')
         }).catch(err => console.log(err));
      })
      return Promise.all(array.map((doc) => {
        return doc.ref.collection('ECommerce').withConverter(eCommerceConverter).get().then((eCommerceSnapshot) => {
          let arrayEcommerce:FirebaseFirestore.QueryDocumentSnapshot<ECommerce>[]= [];
          eCommerceSnapshot.forEach(element => {
            arrayEcommerce.push(element);
          });
          return Promise.all(arrayEcommerce.map((ec)=>{
            const eco:ECommerce = ec.data();
            if(eco.shopName==='Senukai') {
              return getSenukaiProduct(eco.productName,eco.href).then((eCommerce)=>{
                ec.ref.set(eCommerce).then(()=>{
                  console.log("Updated eCommerce")
                }).catch((error)=>{ console.log(error)})
                return eCommerce
              })
            }
            else if (eco.shopName === 'Amazon') {
              return getAmazonProduct(eco.productName,eco.href).then((eCommerce)=>{
                ec.ref.set(eCommerce).then(()=>{
                  console.log("Updated eCommerce")
                }).catch((error)=>{ console.log(error)})
                return eCommerce
              })
            }
            else {
              return {
                shopName: '',
                shopLogoURL: '',
                productName: '',
                lowestPrice: 0,
                photoURL: '',
                href: '',
              }
            }
          }))
        })
      }))
    }),

  ]).then((data) => {
    console.log("done");
    response.send("done");
  }).catch((error)=> {
    console.log(error);
  });
})


export const updateProductCron = functions.runWith({memory:'2GB'}).pubsub.schedule('every 1 minutes').onRun((context) => {
  const time = admin.firestore.Timestamp.now().seconds-600;

  return Promise.all([
    admin.firestore().collection('product').where('date','<',time).limit(2).withConverter(productConverter).get().then((querySnapshot)=>{
      let array:FirebaseFirestore.QueryDocumentSnapshot<Product>[] =[] 
      querySnapshot.forEach(doc => {
         array.push(doc);
         let product:Product = doc.data();
         product.date = admin.firestore.Timestamp.now().seconds;
         doc.ref.set(product).then(() => {
           console.log('set new time')
         }).catch(err => console.log(err));
      })
      return Promise.all(array.map((doc) => {
        return doc.ref.collection('ECommerce').withConverter(eCommerceConverter).get().then((eCommerceSnapshot) => {
          let arrayEcommerce:FirebaseFirestore.QueryDocumentSnapshot<ECommerce>[]= [];
          eCommerceSnapshot.forEach(element => {
            arrayEcommerce.push(element);
          });
          return Promise.all(arrayEcommerce.map((ec)=>{
            const eco:ECommerce = ec.data();
            if(eco.shopName==='Senukai') {
              return getSenukaiProduct(eco.productName,eco.href).then((eCommerce)=>{
                ec.ref.set(eCommerce).then(()=>{
                  console.log("Updated eCommerce")
                }).catch((error)=>{ console.log(error)})
                return eCommerce
              })
            }
            else if (eco.shopName === 'Amazon') {
              return getAmazonProduct(eco.productName,eco.href).then((eCommerce)=>{
                ec.ref.set(eCommerce).then(()=>{
                  console.log("Updated eCommerce")
                }).catch((error)=>{ console.log(error)})
                return eCommerce
              })
            }
            else {
              return {
                shopName: '',
                shopLogoURL: '',
                productName: '',
                lowestPrice: 0,
                photoURL: '',
                href: '',
              }
            }
          }))
        })
      }))
    }),

  ]).then((data) => {
    console.log("done");
  }).catch((error)=> {
    console.log(error);
  });
})



async function getSenukaiProduct(searchString:string,href:any):Promise<ECommerce> {
  const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
  const page:puppeteer.Page = await browser.newPage();
  let senukaiProduct:ECommerce = {
    shopName: 'Senukai',
    shopLogoURL: 'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png',
    productName: '',
    lowestPrice: 0,
    photoURL: '',
    href: '',
  }
  let hreff = href;
  if(hreff === '') {
    await Promise.all([

      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.goto('https://www.senukai.lt/paieska/?q='),
    ]);
    await page.type('input#q.sn-suggest-input.autocomplete.main-search-input', searchString)

    await Promise.all([
        page.waitForNavigation({
          waitUntil: 'networkidle0',
        }),
        await page.click('button.main-search-submit'),
    ]);
    
    await page.waitFor(5000);
    const results = await page.$$eval(".mobile-menu-title span", (elms) => {return elms.map(elm => elm.innerHTML)})
    const resultText = results[1].replace('(','').replace(')','');
    const resultINT = parseInt(resultText);
    if(resultINT>0) {
      hreff = await page.$eval(".new-product-hover a.new-product-name", (elm: Element) => elm.getAttribute('href'));
        if(hreff) {
            await Promise.all([
                page.waitForNavigation({
                waitUntil: 'networkidle0',
                }),
                await page.goto("https://www.senukai.lt/"+hreff),
            ]);
            hreff = "https://www.senukai.lt/"+hreff
          }
    }
  }
  else {
    await Promise.all([
      page.waitForNavigation({
      waitUntil: 'networkidle0',
      }),
      await page.goto(hreff),
    ]);
  }

  let name = await page.$eval(".product-righter h1",(elm) => elm.innerHTML);
  const price = await (await page.$eval(".product-price-details span span", (elm) => elm.innerHTML)).replace(',','.');

  const photoURL = await page.$eval(".product-gallery-slider__slide__link", (elm) => elm.getAttribute('href'));
  name = name.replace(/\n/g, "");
  if(price && photoURL && name && hreff) {

    senukaiProduct = {
      shopName: 'Senukai',
      shopLogoURL: 'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png',
      productName: name,
      lowestPrice: parseFloat(price),
      photoURL: photoURL,
      href: hreff,
    }
    browser.close().then(()=>console.log("succesfuly closed browser")).catch((error)=>{console.log(error)});
    return senukaiProduct
  }
  else {
    browser.close().then(()=>console.log("succesfuly closed browser")).catch((error)=>{console.log(error)});
    return senukaiProduct
  }
}

async function getAmazonProduct(searchString:string,href:any):Promise<ECommerce> {
  const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
  const page:puppeteer.Page = await browser.newPage();
  let amazonProduct:ECommerce = {
    shopName: 'Amazon',
    shopLogoURL: 'https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize',
    productName: '',
    lowestPrice: 0,
    photoURL: '',
    href: '',
  }
  let hreff = href;
  if(hreff === '') {
    await page.goto('https://www.amazon.de/?currency=EUR&language=en_GB');
    await page.type('#twotabsearchtextbox', searchString)
    await Promise.all([
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.click(".nav-search-submit-text"),
    ]);

    const products = await page.$$('.s-include-content-margin');
    for(let i=0; i<products.length; i++) {
      const isntvalid = await products[i].$$('.a-declarative .a-color-secondary');

      if(isntvalid.length > 0) {
        products.splice(i,1)
        i--;
      }
      else {
        break;
      }
    }

    hreff = await products[0].$eval('.s-no-outline',  (elm: Element) => elm.getAttribute('href'));
    hreff = "https://www.amazon.de/"+hreff
    console.log(hreff);
    await Promise.all([
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.goto(hreff),
    ]);
  }
  else {
    await Promise.all([
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.goto(hreff),
    ]);
  }

  const buyBox = await page.$$(".a-box-group #price_inside_buybox");
  let buyboxPrice = '';
  if(buyBox.length>0) {
    buyboxPrice = await page.$eval(".a-box-group #price_inside_buybox", (elm) => elm.innerHTML);
    buyboxPrice = buyboxPrice.replace('€','');
  }
  const price:number = parseFloat(buyboxPrice)
  let name = await page.$eval(".a-size-large .product-title-word-break ", (elm) => elm.innerHTML);
  name = name.replace(/\n/g, "");
  const urlPhoto = await page.$eval(".a-dynamic-image-container .imgTagWrapper img", (elm) => elm.getAttribute('src'));
  if(urlPhoto) {
    browser.close().then(()=>console.log("succesfuly closed browser")).catch((error)=>{console.log(error)});
    return amazonProduct = {
      shopName: 'Amazon',
      shopLogoURL: 'https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize',
      productName: name,
      lowestPrice: price,
      photoURL: urlPhoto,
      href: hreff,
    }
  }
  else{
    browser.close().then(()=>console.log("succesfuly closed browser")).catch((error)=>{console.log(error)});
    return amazonProduct
  }
}