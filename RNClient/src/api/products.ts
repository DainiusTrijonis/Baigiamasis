import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes }  from '@react-native-firebase/auth'
import functions from '@react-native-firebase/functions'
import { diffClamp } from 'react-native-reanimated';

export class Product {
  id:string;
  name: string;
  photoURL: string;
  date: number;
  lowestPrice:number;
  highestPrice:number;
  createdAt: number;
  wish?:Wish ;
  constructor (id:string,name:string,photoURL:string, date:number, lowestPrice:number, highestPrice:number, createdAt:number, wish?:Wish) {
    this.id = id;
    this.name = name;
    this.photoURL = photoURL
    this.date = date;
    this.lowestPrice = lowestPrice;
    this.highestPrice = highestPrice;
    this.createdAt = createdAt;
    this.wish = wish;
  }
}
  
export class History {
    lowestPrice: number;
    date: number;
    constructor (lowestPrice:number, date:number) {
        this.lowestPrice = lowestPrice;
        this.date = date;
    }
}
  
export class ECommerce {
  id:string;
  shopName: string;
  shopLogoURL: string;
  productName: string;
  lowestPrice: number;
  photoURL: string;
  href: string;
  constructor (id:string,shopName:string, shopLogoURL:string, productName:string, lowestPrice:number, photoURL:string, href:string) {
      this.id = id;
      this.shopName = shopName;
      this.shopLogoURL = shopLogoURL;
      this.productName = productName;
      this.lowestPrice = lowestPrice;
      this.photoURL = photoURL;
      this.href = href;
  }
}

export class Review {
  id:string;
  stars: number;
  ownerEmail: string;
  comment: string;
  date: FirebaseFirestoreTypes.Timestamp;
  constructor(id:string,stars:number,ownerEmail:string,comment:string,date:FirebaseFirestoreTypes.Timestamp) {
    this.id = id;
    this.stars = stars;
    this.ownerEmail = ownerEmail;
    this.comment = comment;
    this.date = date;
  }

}
class Wish {
  id: string;
  toNotify:boolean;
  lastNotified: number;
  priceWhenToNotify:number;
  uid:string;
  constructor(id:string,toNotify:boolean,lastNotified:number, priceWhenToNotify:number,uid:string) {
    this.id = id;
    this.toNotify = toNotify;
    this.lastNotified = lastNotified;
    this.priceWhenToNotify = priceWhenToNotify;
    this.uid = uid;
  }


}

export type ApiClient = {
  getProductRealtime(callback:any, productId:string): void
  getECommerceRealtime(callback:any, productId: string):void
  getHistoryRealtime(callback:any, productId:string):void
  getReviewsRealTime(callback:any, productId:string):void
  getWishListRealtime(callback:any,uid:string): void
  //getWishListRealtime2(callback:any,uid:string): void
  sendReview(message:string, stars:number, productId:string):void
  getEcommercesOnKeyword(keyword:string):void
  addProductToSystem(eCommerce:ECommerce[]):void
}
function sortBy(arr:ECommerce[], ascending:boolean) {
  return arr.sort((a, b) => {
      if(a.lowestPrice == 0 ) return ascending ? 1 : -1;
      if(b.lowestPrice == 0 ) return ascending ? -1 : 1;
      if (ascending) return a.lowestPrice > b.lowestPrice ? 1 : -1;
      return a.lowestPrice > b.lowestPrice ? -1 : 1;
  })
}
export const createApiClient = (): ApiClient => {
  return {
    getProductRealtime: (callback,id) => {
      const unsubscribe = firestore().collection('product').doc(id).onSnapshot((snap) => {
        const snapshot = snap.data();
        if(snapshot) {
          const product:Product = new Product(snap.id,snapshot.name,snapshot.photoURL,parseFloat(snapshot.date),parseFloat(snapshot.lowestPrice),parseFloat(snapshot.highestPrice),parseFloat(snapshot.createdAt) )
          callback(product);
        }
      })
      return function() {
        unsubscribe();
      }
    },
    getECommerceRealtime: (callback,id) => {
      const unsubscribe = firestore().collection('product').doc(id).collection('ECommerce').orderBy('lowestPrice','asc').onSnapshot((snap) => {
        let eCommerceArray = new Array<ECommerce>();
        snap.forEach(element => {
          const eCommerce:ECommerce = new ECommerce(element.id,element.data().shopName, element.data().shopLogoURL, element.data().productName, element.data().lowestPrice, element.data().photoURL, element.data().href);
          eCommerceArray.push(eCommerce)
        });
        eCommerceArray = sortBy(eCommerceArray, true);
        console.log("refreshed")
        callback(eCommerceArray);
      })
      return function() {
        unsubscribe();
      }
    },
    getHistoryRealtime:(callback,id) => {
      const unsubscribe = firestore().collection('product').doc(id).collection('history').orderBy('date','asc').onSnapshot((snap) => {
        let historyArray = new Array<History>();
        snap.forEach(element => {
          const history:History = new History(element.data().lowestPrice,element.data().date);
          historyArray.push(history)
        });
        callback(historyArray);
      })
      return function() {
        unsubscribe();
      }
    },
    getReviewsRealTime:(callback,id) => {
      const unsubscribe = firestore().collection('product').doc(id).collection('reviews').orderBy('date','desc').onSnapshot((snap) => {
        let reviewArray = new Array<Review>();
        snap.forEach(element => {
          const review:Review = new Review(element.id,element.data().stars,element.data().ownerEmail,element.data().comment,element.data().date);
          reviewArray.push(review)
        });
        callback(reviewArray);
      })
      return function() {
        unsubscribe();
      }
    },
    sendReview:async (message,stars,productId) => {
      const user = auth().currentUser;
      if(user) {
        const x = auth().currentUser?.getIdToken(true).then((idToken)=>{
          if(idToken) {
            if(message!= '') {
              const data: { [key: string]: any} = {idToken, message,stars, productId }
              return  functions().httpsCallable('addReview')(data).then(response =>{
                console.log(response.data())
                return true;
              }).catch((error) => {
                  console.log(error);
                  return false;
              });
            } else {
              return false;
            }
          } else {
            return false;
          }
        }).catch((error) => {
          console.log(error)
          return false;
        })
        return x;
      }else {
        return false;
      }

      
    },
    getWishListRealtime: (callback, uid) => {      
      const unsubscribe = firestore().collectionGroup('wished').where('uid','==',uid).onSnapshot(async (snap) => {
        if(snap) {
          let wishedDocs = Array<FirebaseFirestoreTypes.DocumentData>()
          snap.forEach(async element => {
            wishedDocs.push(element)
          });
          await Promise.all(
            wishedDocs.map(async (element) => {
              const product:Product = await element.ref.parent.parent?.get().then((doc)=>{
                const snapshotWish = element.data();
                const snapshotProduct = doc.data();
                if(snapshotProduct && snapshotWish) {
                  let wish = new Wish(element.id,snapshotWish.toNotify,snapshotWish.lastNotified,snapshotWish.priceWhenToNotify,snapshotWish.uid);
                  let product = new Product(doc.id,snapshotProduct.name,snapshotProduct.photoURL,snapshotProduct.date,snapshotProduct.lowestPrice,snapshotProduct.highestPrice,snapshotProduct.createdAt,wish);
                  return product;
                }
              })
              if(product) {
                return product;
              }
            })
          ).then((data) => {
            console.log("should call back")
            callback(data)
          })
        }
      })
      return function() {
        unsubscribe();
      }
    },
    // getWishListRealtime2: (callback,uid) => {
    //   const unsubscribe = firestore().collectionGroup('wished').where('uid','==',uid).onSnapshot(async (snap) => {
    //     let productArray = new Array<Product>();
    //     callback(eCommerceArray);
    //   })
    //   return function() {
    //     unsubscribe();
    //   }
    // },

    

    getEcommercesOnKeyword: async (keyword) => {
      const data: { [key: string]: any} = {keyword}
      functions().useFunctionsEmulator('http://localhost:5001');

      const x = await functions().httpsCallable('getProducts')(data).then((res) => {
        let eCommerceArray:ECommerce[][] = new Array<ECommerce[]>()  
        eCommerceArray = res.data;
        return eCommerceArray
      }).catch((error) => {
        console.log(error)
        return new Array<ECommerce[]>();  
      })
      return x;

    },

    addProductToSystem: async (eCommerce) => {
      const user = auth().currentUser;
      if(user) {
        const x = auth().currentUser?.getIdToken(true).then(async (idToken)=>{
          if(idToken) {
            const data: { [key: string]: any} = {eCommerce, idToken}
            functions().useFunctionsEmulator('http://localhost:5001');
      
            await functions().httpsCallable('addProduct')(data).then((res) => {
              console.log(res.data);
            })
          } else {
            return false;
          }
        }).catch((error) => {
          console.log(error)
          return false;
        })
        return x;
      }else {
        return false;
      }
    }
  }
}