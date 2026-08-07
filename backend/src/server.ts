import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import cron from 'node-cron'

dotenv.config()

import authRoutes from './routes/auth'
import clientRoutes from './routes/clients'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'
import inventoryRoutes from './routes/inventory'
import vendorRoutes from './routes/vendors'
import dispatchRoutes from './routes/dispatch'
import stockpointRoutes from './routes/stockpoints'
import brandRoutes from './routes/brands'
import adminRoutes from './routes/admin'
import dashboardRoutes from './routes/dashboard'
import documentSequenceRoutes from './routes/documentSequences'
import requisitionRoutes from './routes/requisitions'
import purchaseOrderRoutes from './routes/purchaseOrders'
import enquiryRoutes from './routes/enquiries'
import offerRoutes from './routes/offers'
import proformaInvoiceRoutes from './routes/proformaInvoices'
import reportRoutes from './routes/reports'
import notificationRoutes from './routes/notifications'
import { sendRequisitionReminders } from './utils/reminderCron'

const app = express()
const PORT = process.env.PORT || 3001

// Behind nginx — trust the first proxy hop so express-rate-limit and req.ip work correctly.
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 })
app.use('/api/', limiter)

app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/inventory-items', inventoryRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/stockpoints', stockpointRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/document-sequences', documentSequenceRoutes)
app.use('/api/requisitions', requisitionRoutes)
app.use('/api/purchase-orders', purchaseOrderRoutes)
app.use('/api/enquiries', enquiryRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/proforma-invoices', proformaInvoiceRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/notifications', notificationRoutes)

// Daily reminder cron at 8 AM
cron.schedule('0 8 * * *', () => {
  sendRequisitionReminders().catch(console.error)
})

app.get('/api/health', (_req: any, res: any) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.listen(PORT, () => {
  console.log(`AMI ERP backend running on port ${PORT}`)
})

export default app
