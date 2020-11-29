import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth  from '@react-native-firebase/auth'
import functions from '@react-native-firebase/functions'
import firebase from '@react-native-firebase/app'
export class Product {
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
    fromFirestore: function(snapshot:FirebaseFirestoreTypes.QueryDocumentSnapshot){
        const data = snapshot.data();
        return new Product(data.name, data.photoURL, data.date);
    },
}
  
export class History {
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
    fromFirestore: function(snapshot:FirebaseFirestoreTypes.QueryDocumentSnapshot){
        const data = snapshot.data();
        return new History(data.lowestPrice, data.date);
    },
}
  
   
class CommerceQuery {
    eCommerce: ECommerce;
    reference: FirebaseFirestoreTypes.QueryDocumentSnapshot<ECommerce>
    constructor (eCommerce:ECommerce, reference:FirebaseFirestoreTypes.QueryDocumentSnapshot<ECommerce>) {
        this.eCommerce = eCommerce;
        this.reference = reference;
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
  fromFirestore: function(snapshot:FirebaseFirestoreTypes.QueryDocumentSnapshot){
      const data = snapshot.data();
      return new ECommerce(data.shopName, data.shopLogoURL, data.productName, data.lowestPrice, data.photoURL, data.href);
  },
}

export type ApiClient = {
  getProductRealtime(callback:any, productId:string): void
}

export const createApiClient = (): ApiClient => {
  return {
    getProductRealtime: (callback,id) => {
      firestore().collection('product').doc(id).onSnapshot((snap) => {
        const snapshot = snap.data();
        if(snapshot) {
          const product:Product = new Product(snapshot.name,snapshot.photoURL,parseFloat(snapshot.date))
          callback(product);
        }
      })
    }


  }
}