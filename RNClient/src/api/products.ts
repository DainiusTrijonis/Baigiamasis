import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes }  from '@react-native-firebase/auth'
import functions from '@react-native-firebase/functions'
import firebase from '@react-native-firebase/app'
import Ionicons from 'react-native-vector-icons/Ionicons';
export class Product {
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
  
export class History {
    lowestPrice: number;
    date: number;
    constructor (lowestPrice:number, date:number) {
        this.lowestPrice = lowestPrice;
        this.date = date;
    }
}
  
export class ECommerce {
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

export class Review {
  stars: number;
  ownerEmail: string;
  comment: string;
  date: FirebaseFirestoreTypes.Timestamp;
  constructor(stars:number,ownerEmail:string,comment:string,date:FirebaseFirestoreTypes.Timestamp) {
    this.stars = stars;
    this.ownerEmail = ownerEmail;
    this.comment = comment;
    this.date = date;
  }

}

export type ApiClient = {
  getProductRealtime(callback:any, productId:string): void
  getECommerceRealtime(callback:any, productId: string):void
  getHistoryRealtime(callback:any, productId:string):void
  getReviewsRealTime(callback:any, productId:string):void
  getWishListRealtime(callback:any,uid:string): void
  sendReview(message:string, stars:number, productId:string):void
}

export const createApiClient = (): ApiClient => {
  return {
    getProductRealtime: (callback,id) => {
      firestore().collection('product').doc(id).onSnapshot((snap) => {
        const snapshot = snap.data();
        if(snapshot) {
          const product:Product = new Product(snapshot.name,snapshot.photoURL,parseFloat(snapshot.date),parseFloat(snapshot.lowestPrice),parseFloat(snapshot.highestPrice),parseFloat(snapshot.createdAt) )
          callback(product);
        }
      })
    },
    getECommerceRealtime: (callback,id) => {
      firestore().collection('product').doc(id).collection('ECommerce').orderBy('lowestPrice','asc').onSnapshot((snap) => {
        let eCommerceArray = new Array<ECommerce>();
        snap.forEach(element => {
          const eCommerce:ECommerce = new ECommerce(element.data().shopName, element.data().shopLogoURL, element.data().productName, element.data().lowestPrice, element.data().photoURL, element.data().href);
          eCommerceArray.push(eCommerce)
        });
        
        callback(eCommerceArray);
      })
    },
    getHistoryRealtime:(callback,id) => {
      firestore().collection('product').doc(id).collection('history').orderBy('date','asc').onSnapshot((snap) => {
        let historyArray = new Array<History>();
        snap.forEach(element => {
          const history:History = new History(element.data().lowestPrice,element.data().date);
          historyArray.push(history)
        });
        callback(historyArray);
      })
    },
    getReviewsRealTime:(callback,id) => {
      firestore().collection('product').doc(id).collection('reviews').orderBy('date','asc').onSnapshot((snap) => {
        let reviewArray = new Array<Review>();
        snap.forEach(element => {
          const review:Review = new Review(element.data().stars,element.data().ownerEmail,element.data().comment,element.data().date);
          reviewArray.push(review)
        });
        callback(reviewArray);
      })
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
      firestore().collection('WishList').doc(uid).onSnapshot((snap) => {
        const snapshot = snap.data();
        let eCommerceArray: ECommerce[] = new Array<ECommerce>();
        if(snapshot)
        snapshot.forEach((element:any) => {
          const eCommerce:ECommerce = element.data();
          eCommerceArray.push(eCommerce);
        });
        callback(eCommerceArray);
      })
    },
  }
}