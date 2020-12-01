import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
const serviceAccount = require("../ServiceKeyAccount.json");
const algoliasearch = require('algoliasearch')
// Initialize Algolia, requires installing Algolia dependencies:
// https://www.algolia.com/doc/api-client/javascript/getting-started/#install
//
// App ID and API Key are stored in functions config variables
const ALGOLIA_ID = functions.config().algolia.app;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.key;

const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);

const index = client.initIndex('product');

class Product {
  name: string;
  photoURL: string;
  date: number;
  lowestPrice:number;
  highestPrice:number;
  createdAt: number
  constructor (name:string,photoURL:string, date:number, lowestPrice:number, highestPrice:number, createdAt:number) {
    this.name = name;
    this.photoURL = photoURL
    this.date = date;
    this.lowestPrice = lowestPrice;
    this.highestPrice = highestPrice;
    this.createdAt = createdAt;
  }
}
const productConverter = {
  toFirestore: function(product:Product) {
      return {
        name: product.name,
        photoURL: product.photoURL,
        date: product.date,
        lowestPrice: product.lowestPrice,
        highestPrice: product.highestPrice,
        createdAt: product.createdAt,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new Product(data.name, data.photoURL, data.date, data.lowestPrice, data.highestPrice, data.createdAt);
  },
}

class History {
  lowestPrice: number;
  date: number;
  constructor (lowestPrice:number, date:number) {
    this.lowestPrice = lowestPrice;
    this.date = date;
  }
}
const historyConverter = {
  toFirestore: function(history:History) {
      return {
        lowestPrice: history.lowestPrice,
        date: history.date,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new History(data.lowestPrice, data.date);
  },
}
export class Review {
  stars: number;
  ownerEmail: string;
  comment: string;
  date: FirebaseFirestore.Timestamp;
  constructor(stars:number,ownerEmail:string,comment:string,date:FirebaseFirestore.Timestamp) {
    this.stars = stars;
    this.ownerEmail = ownerEmail;
    this.comment = comment;
    this.date = date;
  }

}
const reviewConverter = {
  toFirestore: function(review:Review) {
      return {
        stars: review.stars,
        ownerEmail: review.ownerEmail,
        comment: review.comment,
        date: review.date,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new Review(data.stars, data.ownerEmail, data.comment, data.date);
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

export const addReview = functions.https.onCall((data) => {
  return admin.auth().verifyIdToken(data['idToken']).then((token) => {
    if(token.email) {
      if(data['message'] && data['stars'] && data['productId']) {
        const review:Review = new Review(data['stars'],token.email,data['message'], admin.firestore.Timestamp.now())
        return admin.firestore().collection('product').doc(data['productId']).collection('reviews').withConverter(reviewConverter).add(review).then(() => {
          return true;
        }).catch((error)=>{
          console.log(error);
          return false;
        });
      }
      else{
        return false;
      }
    }
    else {
      return false;
    }
  }).catch((error)=>{
    console.log(error);
    return false;
  });
})

exports.addToIndex = functions.firestore.document('product/{productId}').onCreate((snapshot)=>{
  const data = snapshot.data();
  const objectID = snapshot.id;
  return index.saveObject({ ...data, objectID});
})

exports.updateToIndex = functions.firestore.document('product/{productId}').onUpdate((snapshot)=>{
  const data = snapshot.after.data();
  const objectID = snapshot.after.id;
  return index.saveObject({ ...data, objectID});
})

exports.deleteFromIndex = functions.firestore.document('product/{productId}').onDelete((snapshot)=>index.deleteObject(snapshot.id))

export const checkPrice = functions.runWith({memory:'2GB'}).https.onRequest(async (request, response) => {
  const boolean:Boolean = await getSenukaiProduct("sony xm3",'').then((eCommerce:ECommerce) => {
    const product:Product = {name: eCommerce.productName, photoURL:eCommerce.photoURL, date:admin.firestore.Timestamp.now().seconds,lowestPrice:0,highestPrice:0,createdAt:admin.firestore.Timestamp.now().seconds }
    if(eCommerce.href !== '') {
      return admin.firestore().collection('product').add(product).then((doc) => {
        
        return doc.collection('ECommerce').doc(eCommerce.shopName).set(eCommerce).then(async () => {
          console.log("Finish set function for Senukai");
          await getAmazonProduct(product.name,'').then((eCommerceA:ECommerce) => {
            doc.collection('ECommerce').doc(eCommerceA.shopName).set(eCommerceA).then( ()=>{
              console.log("Finish set function for Amazon")
            }).catch((error) => {   
              console.log(error)
            })
          })
          return true;
        }).catch((error) => {
          console.log(error);
          return false;
        });
      }).catch((error) => {
        console.log(error);
        return false;
      }) 
    }
    else {
      return false;
    }
  }).catch((error) => {
    console.log(error)
    return false;
  });
  console.log(boolean);
  response.send(boolean);

});

export const updateProductCron = functions.runWith({memory:'2GB'}).pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const time = admin.firestore.Timestamp.now().seconds-3600;
  const bool:boolean = await admin.firestore().collection('product').where('date','<',time).limit(2).withConverter(productConverter).get().then(async (querySnapshot)=>{
    let array:FirebaseFirestore.QueryDocumentSnapshot<Product>[] =[] 
    querySnapshot.forEach(element => {
      array.push(element);
    });
    const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
    const productMap:boolean = await Promise.all(array.map( async(product) => {
      return product.ref.collection('ECommerce').withConverter(eCommerceConverter).get().then(async (eCommerceSnapshot) => {
        let arrayEcommerce:FirebaseFirestore.QueryDocumentSnapshot<ECommerce>[]= [];
        eCommerceSnapshot.forEach(element => {
          arrayEcommerce.push(element);
        })
        return await Promise.all(arrayEcommerce.map(async (eCommerceQuery) => {
          let eCommerce:ECommerce = eCommerceQuery.data();
          if(eCommerce.shopName === "Senukai") {
            const updatedECommerce = await updateSenukaiPrice(eCommerce, await browser.newPage())
            eCommerceQuery.ref.set(updatedECommerce).then(()=>{console.log()}).catch((error)=>{console.log(error)})
            return updatedECommerce
          }
          else if (eCommerce.shopName === "Amazon") {
            const updatedECommerce = await updateAmazonPrice(eCommerce, await browser.newPage())
            eCommerceQuery.ref.set(updatedECommerce).then(()=>{console.log()}).catch((error)=>{console.log(error)})
            return updatedECommerce
          }
          else {
            return eCommerceQuery.data()
          }
        })).then((data) => {
          let eCommerceArray:ECommerce[] = data;
          eCommerceArray = sortBy(eCommerceArray,false);
          let updatedProduct = product.data();
          
          let highestValue = eCommerceArray[0].lowestPrice;
          if(highestValue == 0) {
            for(const eCommerce of eCommerceArray) {
              if(eCommerce.lowestPrice != 0) {
                highestValue = eCommerce.lowestPrice
                break;
              }
            }
          }
          const lowestValue:number = eCommerceArray[eCommerceArray.length-1].lowestPrice;



          updatedProduct.lowestPrice = lowestValue
          updatedProduct.highestPrice = highestValue;
          updatedProduct.date = admin.firestore.Timestamp.now().seconds;

          product.ref.set(updatedProduct).then(()=>{
            console.log("Succesfully update product");
          }).catch((error)=>{
            console.log(error)
          });
          product.ref.collection("history").withConverter(historyConverter).add(new History(updatedProduct.lowestPrice,updatedProduct.date)).then((historyQue) => {
            console.log("update history")
            historyQue.parent.where('date','<',time-86000).withConverter(historyConverter).get().then((referenceHistory)=> {
              referenceHistory.forEach(historyRef => {
                historyRef.ref.delete().then(()=>console.log("succesfully delete old history")).catch((eror)=>console.log(eror));
              });
            }).catch((error)=>{console.log(error)})
          }).catch((error)=>{
            console.log(error);
          })
          return true;
        }).catch((error) => {
          console.log(error);
          return false;
        })
      }).catch((error) => {
        console.log(error);
        return false;
      }).catch((error) => {
        console.log(error)
        return false;
      })
    })).then((data)=>{
      browser.close().then(() => {
        console.log("Succesfully closed browser")
      }).catch((err) => {
        console.log("Bad close browser "+ err)
      }); 
      return true;
    }).catch((error) => {
      console.log(error)
      browser.close().then(() => {
        console.log("Succesfully closed browser")
      }).catch((err) => {
        console.log("Bad close browser "+ err)
      }); 
      return false;
    })
    return productMap;
  }).catch((error) => {
    console.log(error);
    return false;
  })
  return bool;
})

export const updateProductTest = functions.runWith({memory:'2GB'}).https.onRequest(async (request,response) => {
  const time = admin.firestore.Timestamp.now().seconds-3600;
  const bool:boolean = await admin.firestore().collection('product').where('date','<',time).limit(2).withConverter(productConverter).get().then(async (querySnapshot)=>{
    let array:FirebaseFirestore.QueryDocumentSnapshot<Product>[] =[] 
    querySnapshot.forEach(element => {
      array.push(element);
    });
    const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
    const productMap:boolean = await Promise.all(array.map( async(product) => {
      return product.ref.collection('ECommerce').withConverter(eCommerceConverter).get().then(async (eCommerceSnapshot) => {
        let arrayEcommerce:FirebaseFirestore.QueryDocumentSnapshot<ECommerce>[]= [];
        eCommerceSnapshot.forEach(element => {
          arrayEcommerce.push(element);
        })
        return await Promise.all(arrayEcommerce.map(async (eCommerceQuery) => {
          let eCommerce:ECommerce = eCommerceQuery.data();
          if(eCommerce.shopName === "Senukai") {
            const updatedECommerce = await updateSenukaiPrice(eCommerce, await browser.newPage())
            eCommerceQuery.ref.set(updatedECommerce).then(()=>{console.log()}).catch((error)=>{console.log(error)})
            return updatedECommerce
          }
          else if (eCommerce.shopName === "Amazon") {
            const updatedECommerce = await updateAmazonPrice(eCommerce, await browser.newPage())
            eCommerceQuery.ref.set(updatedECommerce).then(()=>{console.log()}).catch((error)=>{console.log(error)})
            return updatedECommerce
          }
          else {
            return eCommerceQuery.data()
          }
        })).then((data) => {
          let eCommerceArray:ECommerce[] = data;
          eCommerceArray = sortBy(eCommerceArray,false);
          let updatedProduct = product.data();
          
          let highestValue = eCommerceArray[0].lowestPrice;
          if(highestValue == 0) {
            for(const eCommerce of eCommerceArray) {
              if(eCommerce.lowestPrice != 0) {
                highestValue = eCommerce.lowestPrice
                break;
              }
            }
          }
          const lowestValue:number = eCommerceArray[eCommerceArray.length-1].lowestPrice;



          updatedProduct.lowestPrice = lowestValue
          updatedProduct.highestPrice = highestValue;
          updatedProduct.date = admin.firestore.Timestamp.now().seconds;

          product.ref.set(updatedProduct).then(()=>{
            console.log("Succesfully update product");
          }).catch((error)=>{
            console.log(error)
          });
          product.ref.collection("history").withConverter(historyConverter).add(new History(updatedProduct.lowestPrice,updatedProduct.date)).then((historyQue) => {
            console.log("update history")
            historyQue.parent.where('date','<',time-86000).withConverter(historyConverter).get().then((referenceHistory)=> {
              referenceHistory.forEach(historyRef => {
                historyRef.ref.delete().then(()=>console.log("succesfully delete old history")).catch((eror)=>console.log(eror));
              });
            }).catch((error)=>{console.log(error)})
          }).catch((error)=>{
            console.log(error);
          })
          return true;
        }).catch((error) => {
          console.log(error);
          return false;
        })
      }).catch((error) => {
        console.log(error);
        return false;
      }).catch((error) => {
        console.log(error)
        return false;
      })
    })).then((data)=>{
      browser.close().then(() => {
        console.log("Succesfully closed browser")
      }).catch((err) => {
        console.log("Bad close browser "+ err)
      }); 
      return true;
    }).catch((error) => {
      console.log(error)
      browser.close().then(() => {
        console.log("Succesfully closed browser")
      }).catch((err) => {
        console.log("Bad close browser "+ err)
      }); 
      return false;
    })
    return productMap;
  }).catch((error) => {
    console.log(error);
    return false;
  })
  response.send(bool);
})


function sortBy(arr:ECommerce[], ascending:boolean) {
  return arr.sort((a, b) => {
      if(a.lowestPrice == 0 ) return ascending ? 1 : -1;
      if(b.lowestPrice == 0 ) return ascending ? -1 : 1;
      if (ascending) return a.lowestPrice > b.lowestPrice ? 1 : -1;
      return a.lowestPrice > b.lowestPrice ? -1 : 1;
  })
}
async function updateSenukaiPrice(eCommerce:ECommerce, page:puppeteer.Page):Promise<ECommerce> {
  const [response] = await Promise.all([
    page.waitForNavigation({
      waitUntil: 'networkidle0',
    }),
    await page.goto(eCommerce.href),
  ])

  const update = await Promise.all([
    response,
    await page.$eval(".product-price-details span span", (elm) => {return elm.innerHTML.replace(',', '.')}),
  ]).then((data) => {
    const updatedEcommerce = eCommerce;
    const priceString = data[1]; 
    let price = parseFloat(priceString);
    if(isNaN(price) || !price) { 
      price = 0;
    }
    updatedEcommerce.lowestPrice = price;
    return updatedEcommerce;
  })
  return update;
}

async function updateAmazonPrice(eCommerce:ECommerce, page:puppeteer.Page):Promise<ECommerce> {
  const [response] = await Promise.all([
    page.waitForNavigation({
      waitUntil: 'networkidle0',
    }),
    await page.goto(eCommerce.href),
  ])

  const update = await Promise.all([
    response,
    await page.$$(".a-box-group #price_inside_buybox").then(async (doc)=>{
      if(doc.length>0) {
        let buyboxPrice = await page.$eval(".a-box-group #price_inside_buybox", (elm) => elm.innerHTML);
        const price:number = parseFloat(buyboxPrice.replace('€',''));
        return price
      }
      else {
        return 0
      }
    }),
  ]).then((data) => {
    let price = data[1];
    if(isNaN(price) || !price) { 
      price = 0;
    }
    let updatedECommerce = eCommerce;
    updatedECommerce.lowestPrice = price;
    return updatedECommerce;
  })
  return update;
}

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
  const priceString = await (await page.$eval(".product-price-details span span", (elm) => elm.innerHTML)).replace(',','.');
  let price = parseFloat(priceString);
  const photoURL = await page.$eval(".product-gallery-slider__slide__link", (elm) => elm.getAttribute('href'));
  name = name.replace(/\n/g, "");
  if(isNaN(price) || !price) { 
    price = 0;
  }
  if(price && photoURL && name && hreff) {

    senukaiProduct = {
      shopName: 'Senukai',
      shopLogoURL: 'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png',
      productName: name,
      lowestPrice: price,
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
  let price:number = parseFloat(buyboxPrice)
  if(isNaN(price) || !price) { 
    price = 0;
  }
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


exports.getProducts = functions.runWith({memory:'2GB'}).https.onCall(async (searchString:string) => {
  const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
  Promise.all([
    await getArrayECommerceOnSearchSenukai(searchString,await browser.newPage()),
    await getArrayECommerceOnSearchAmazon(searchString,await browser.newPage()),
  ]).then((data)=>{
    browser.close().catch((err)=>{console.log(err)});
    return(data);
  }).catch((error) => {
    console.log(error)
    browser.close().catch((err)=>{console.log(err)});
    return []
  })
})



async function getArrayECommerceOnSearchSenukai(searchString:string,page:puppeteer.Page):Promise<ECommerce[]>{
  
  const [response] = await Promise.all([
    page.waitForNavigation({
      waitUntil: 'networkidle0',
    }),
    await page.goto('https://www.senukai.lt/paieska/?q='),
    await Promise.all([
      await page.type('input#q.sn-suggest-input.autocomplete.main-search-input', searchString),
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.click('button.main-search-submit'),
    ]),
  ])
  const ryzas:ECommerce[] = await Promise.all([
    response,
    await page.$$eval(".mobile-menu-title span", (elms) => {return elms.map(elm => elm.innerHTML)}),
  ]).then(async (data)=>{
    if(data[1][1]) {
      const resultText = data[1][1].replace('(','').replace(')','');
      const resultINT = parseInt(resultText);
      if(resultINT>0) {
        //return answers 
        const productSection = await page.$(".product-grid-row")
        const products  = await productSection?.$$(" .new-product-hover");
        if(products) {
          const promiseECommerceMap:ECommerce[] = await Promise.all(products.map(async (product)=>{
            const imgURL = await product.$eval(" .new-product-image img", (elm:Element) => elm.getAttribute('src'));
            const href = await product.$eval(" a.new-product-name", (elm: Element) => elm.getAttribute('href'));
            const name = await product.$eval(" a.new-product-name", (elm: Element) => elm.innerHTML);
            let price = await product.$eval("   .item-price span", (elm: Element) => elm.textContent);
            if(price && imgURL && href && name) {
              price = price?.replace(",",".");
              const priceFloat = parseFloat(price);
              const eCommerce:ECommerce = new ECommerce(
                "Senukai",
                'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png',
                name,
                priceFloat,
                imgURL,
                "https://www.senukai.lt/"+href
              )
              return eCommerce;
            }   
            else {
              return new ECommerce(
                "Senukai",
                'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png',
                '',
                0,
                '',
                ''
              )
            }
          })).then((prod)=>{
            let productsReduced:ECommerce[] = prod
            for(let i=0; i<productsReduced.length; i++) {
              if(productsReduced[i].productName === "" || productsReduced[i].photoURL === "" || productsReduced[i].href === "")
              productsReduced.splice(i,1)
            }
            console.log(productsReduced.length)
            if(productsReduced.length>10) {
              productsReduced.splice(10,productsReduced.length)
            }
            console.log(productsReduced.length)
    
            return productsReduced

          })
          return promiseECommerceMap

        }
        else {
          return new Array<ECommerce>();
        }
      }
      else {
        return new Array<ECommerce>();
      }
    }
    else {
      return new Array<ECommerce>();
      //return empty
    }
  }).catch((error) => {
    console.log(error);
    return new Array<ECommerce>();
  })

  return ryzas


}

async function getArrayECommerceOnSearchAmazon(searchString:string,page:puppeteer.Page):Promise<ECommerce[]>{
  const [response] = await Promise.all([
    await page.goto('https://www.amazon.de/?currency=EUR&language=en_GB'),
    await page.type('#twotabsearchtextbox', searchString),
    await Promise.all([
      page.waitForNavigation({
        waitUntil: 'networkidle0',
      }),
      await page.click(".nav-search-submit-text"),
    ]),
  ]);
  
  const eCommerces: ECommerce[]= await Promise.all([
    response,
    await page.$$('.s-include-content-margin').then(async (data) =>{
      for(let i=0; i<data.length; i++) {
        const isntvalid = await data[i].$$('.a-declarative .a-color-secondary');
        if(isntvalid.length > 0) {
          data.splice(i,1)
          i--;
        }
        else {
          break;
        }
      }
      const x:ECommerce[] = await Promise.all(data.map(async (productElm) => {
        let href = await productElm.$eval('.s-no-outline',  (elm: Element) => elm.getAttribute('href'));
        href = "https://www.amazon.de/"+href;
        console.log(href);
        let imageURL = await productElm.$eval('.s-no-outline img',  (elm: Element) => elm.getAttribute('src'));
        let price = 0;
        if(await (await productElm.$$('.a-price-whole')).length>0) {
          price = await productElm.$eval('.a-price-whole', (elm:Element) => { return  elm.innerHTML? parseFloat(elm.innerHTML): 0});
        }
        let name = "none";
        if(await (await productElm.$$('.a-price-whole')).length>0)
        name = await productElm.$eval('.s-line-clamp-2 span', (elm:Element) => elm.innerHTML)

        if(href && imageURL && price && name ) {
          return new ECommerce("Amazon","https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize",name,price,imageURL,href)
        }
        else {
          return new ECommerce("","","",0,"","")
        }
      })).then((products) => {
        let productsReduced:ECommerce[] = products
        for(let i=0; i<productsReduced.length; i++) {
          if(productsReduced[i].productName === "" || productsReduced[i].photoURL === "" || productsReduced[i].href === "")
          productsReduced.splice(i,1)
        }
        console.log(productsReduced.length)
        if(productsReduced.length>10) {
          productsReduced.splice(10,productsReduced.length)
        }
        console.log(productsReduced.length)

        return productsReduced
      }).catch((error) => {
        console.log(error);
        return [];
      })
      return x;
      
    }),
  ]).then((data) => {
    return data[1];
  }).catch((error) => {
    console.log(error);
    return []
  })

  return eCommerces;

}

