import {Router} from 'express'
import {verifyJwt} from '../middleware/auth.middleware.js'
import {getHistory, saveHistory} from '../controllers/attempt.controller.js'

const route = Router()

route.post('/saveHistory',verifyJwt,saveHistory)
route.get('/gethistory',verifyJwt,getHistory)

export default route