import {verifyJwt} from '../middleware/auth.middleware.js'
import {authorizeRoles} from '../middleware/authorizeRoles.middleware.js'
import {createQuestion,getQuestion} from '../controllers/question.controller.js'
import Router from 'express'

const route = Router();

route.post("/createquiz",verifyJwt,authorizeRoles("teacher"),createQuestion)
route.get('/getquiz',verifyJwt,getQuestion)

export default route