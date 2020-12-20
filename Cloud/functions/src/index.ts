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
  createdAt: number;
  createdByUID: string;
  constructor (name:string,photoURL:string, date:number, lowestPrice:number, highestPrice:number, createdAt:number, createdByUID:string) {
    this.name = name;
    this.photoURL = photoURL
    this.date = date;
    this.lowestPrice = lowestPrice;
    this.highestPrice = highestPrice;
    this.createdAt = createdAt;
    this.createdByUID = createdByUID;
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
        createdByUID: product.createdByUID,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new Product(data.name, data.photoURL, data.date, data.lowestPrice, data.highestPrice, data.createdAt, data.createdByUID);
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

class Wish {
  toNotify:boolean;
  lastNotified: number;
  priceWhenToNotify:number;
  uid:string;
  constructor(toNotify:boolean,lastNotified:number, priceWhenToNotify:number,uid:string) {
    this.toNotify = toNotify
    this.lastNotified = lastNotified;
    this.priceWhenToNotify = priceWhenToNotify;
    this.uid = uid;
  }


}
const wishConverter = {
  toFirestore: function(wish:Wish) {
      return {
        toNotify:wish.toNotify,
        lastNotified: wish.lastNotified,
        priceWhenToNotify:wish.priceWhenToNotify,
        uid: wish.uid,
      }
  },
  fromFirestore: function(snapshot:FirebaseFirestore.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new Wish(data.toNotify, data.lastNotified, data.priceWhenToNotify, data.uid);
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

exports.updateToIndex = functions.firestore.document('product/{productId}').onUpdate(async (snapshot)=>{
  
  const data = snapshot.after.data();
  //send message to client if notification and value lower
  let title = data['name'] + " Price refresh"
  let content = data['lowestPrice'];
  let message:admin.messaging.Message = {
    notification: {
      title: title,
      body: content,
    },
    topic: "Price update",
  }
  
  await admin.messaging().send(message).then(() => {
    console.log("sent message");
  }).catch((error) => {
    console.log(error);
  })
  
  // admin.messaging().subscribeToTopic(data['idToken'],ref.path).then((res) => {
  //   console.log("Successfully subscribed user to topic");
  // }).catch((error) => {
  //   console.log(error);
  // })
  
  const objectID = snapshot.after.id;
  return index.saveObject({ ...data, objectID});
})

exports.deleteFromIndex = functions.firestore.document('product/{productId}').onDelete((snapshot)=>index.deleteObject(snapshot.id))


export const updateProductCron = functions.runWith({memory:'2GB'}).pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const time = admin.firestore.Timestamp.now().seconds-3600;
  const bool:boolean = await admin.firestore().collection('product').where('date','<',time).limit(1).withConverter(productConverter).get().then(async (querySnapshot)=>{
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
            historyQue.parent.where('date','<',time-43000).withConverter(historyConverter).get().then((referenceHistory)=> {
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
  const time = admin.firestore.Timestamp.now().seconds-60;
  const bool:boolean = await admin.firestore().collection('product').where('date','<',time).limit(1).withConverter(productConverter).get().then(async (querySnapshot)=>{
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
    await page.$$(".product-price-details span span").then(async (doc) => {
      if(doc.length>0) {
        let buyboxPrice = await page.$eval(".product-price-details span span", (elm) => elm.innerHTML.replace(',', '.').replace(' ',''))

        const price:number = parseFloat(buyboxPrice);

        return price;
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
        console.log("buyBoxPrice:" +buyboxPrice);
        const price:number = parseFloat(buyboxPrice.replace('€','').replace(',',''));
        console.log("price:" +price);
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

exports.getProducts = functions.runWith({memory:'2GB'}).https.onCall(async (data) => {
  const browser:puppeteer.Browser = await puppeteer.launch({headless: true, args: [ '--no-sandbox', '--disable-setuid-sandbox']});
  const x = await Promise.all([
    await getArrayECommerceOnSearchSenukai(data['keyword'],await browser.newPage()),
    await getArrayECommerceOnSearchAmazon(data['keyword'],await browser.newPage()),
  ]).then((eCommerces)=>{
    browser.close().catch((err)=>{console.log(err)});
    return(eCommerces);
  }).catch((error) => {
    console.log(error)
    browser.close().catch((err)=>{console.log(err)});
    return [[]]
  })
  return x;
})

exports.addProduct = functions.https.onCall((data) => {
  return admin.auth().verifyIdToken(data['idToken']).then((token) => {
    if(token.uid) {
      console.log(token.uid)
      const eCommerceArray:ECommerce[] = data['eCommerce'];
      let lowestPriceECommerce = sortBy(eCommerceArray,true)[0].lowestPrice ;
      lowestPriceECommerce = parseFloat(lowestPriceECommerce.toExponential(2));
      let highestPriceECommerce = sortBy(eCommerceArray,false)[0].lowestPrice;
      highestPriceECommerce = parseFloat(highestPriceECommerce.toExponential(2));
      console.log(lowestPriceECommerce);
      console.log(highestPriceECommerce)
      const product:Product = new Product(eCommerceArray[0].productName,eCommerceArray[0].photoURL,admin.firestore.Timestamp.now().seconds,lowestPriceECommerce,highestPriceECommerce,admin.firestore.Timestamp.now().seconds, token.uid)
      console.log(product);
      return admin.firestore().collection('product').withConverter(productConverter).add(product).then((ref) => {
        eCommerceArray.forEach(element => {
          ref.collection('ECommerce').withConverter(eCommerceConverter).add(element).then(()=>{console.log("")}).catch((error)=>{console.log(error)})
        });
        ref.collection('wished').withConverter(wishConverter).add(new Wish(true,admin.firestore.Timestamp.now().seconds,lowestPriceECommerce-0.1,token.uid)).then(()=>{console.log("")}).catch((error)=>{console.log(error)})       
        return true;
      }).catch((error) => {
        console.log(error)
        return false;
      })

    }
    else {
      return false;
    }
  }).catch((error)=>{
    console.log(error);
    return false;
  });
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
              price = price?.replace(/\s+/g,'').replace(",",".");
              console.log(price)
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
  if(ryzas.length>0)
  ryzas[0].shopLogoURL = 'https://www.senukai.lt/assets/schema/senukai_lt-f17959262e224d00a32be8c31cfca13315fc1a8f78bb91e4387a93042574f5a7.png'
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
        let imageURL = await productElm.$eval('.s-no-outline img',  (elm: Element) => elm.getAttribute('src'));
        let price = 0;
        let name = "none";
        if(await (await productElm.$$('.a-price-whole')).length>0) {
          price = await productElm.$eval('.a-price-whole', (elm:Element) => { return  elm.innerHTML? parseFloat(elm.innerHTML.replace(',','')): 0});
        }
        if(await (await productElm.$$('.s-line-clamp-2 span')).length>0) {
          name = await productElm.$eval('.s-line-clamp-2 span', (elm:Element) => elm.innerHTML)
        } else {
          name = await productElm.$eval('.a-size-base-plus', (elm:Element) => elm.innerHTML)
        }
        //.a-size-base-plus bic iconska
        
        if(href && imageURL && price && name ) {
          return new ECommerce("Amazon","https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize",name,price,imageURL,href)
        }
        else {
          return new ECommerce("Amazon","https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize","",0,"","")
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
  if(eCommerces.length>0)
  eCommerces[0].shopLogoURL = "https://g.foolcdn.com/image/?url=https:%2F%2Fg.foolcdn.com%2Feditorial%2Fimages%2F485626%2Famzn-logo.jpg&w=700&op=resize"
  return eCommerces;

}


