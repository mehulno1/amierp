declare module 'express-serve-static-core' {
  interface Request {
    user?: import('./index').User
    brandId?: number
    brand?: import('./index').Brand
    userBrandIds?: number[]
  }
}

