import mongoose from 'mongoose'
import { config } from './config.js'

mongoose.set('strictQuery', true)

let connecting = null

/** Connects once and reuses the connection (also safe for serverless hosts). */
export function connectDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection)
  if (!connecting) {
    connecting = mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 10000 }).catch((error) => {
      connecting = null
      throw error
    })
  }
  return connecting
}
