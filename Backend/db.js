import mongoose from 'mongoose'
import { config } from './config.js'
import { migrateLegacyData } from './utils/migrate.js'

mongoose.set('strictQuery', true)

let connecting = null

/**
 * Connects once and reuses the connection (also safe for serverless hosts). Data stored by
 * earlier versions is migrated before the first request is handled.
 */
export function connectDatabase() {
  if (!connecting) {
    connecting = mongoose
      .connect(config.mongodbUri, { serverSelectionTimeoutMS: 10000 })
      .then(async () => {
        await migrateLegacyData()
        return mongoose.connection
      })
      .catch((error) => {
        connecting = null
        throw error
      })
  }
  return connecting
}
