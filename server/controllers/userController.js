const ApiError = require('../error/ApiError') //подгружаем кастомные ошибки
const bcrypt = require('bcrypt') //Хэшируем пароли для хранения в бд
const jwt = require('jsonwebtoken')
const {User, User_cart} = require('../models/models')
const sequelize = require("express");
const db = require('../db');
const { QueryTypes } = require('sequelize');


const generateJWT = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '2h'}
    )
}

function parseJwt (token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

class UserController {
    async registration(req, res, next) {
        const {email, password, role} = req.body
        if(!email || !password) {
            return next(ApiError.badRequest('Wrong data'))
        }
        const candidate = await User.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('User with this email already has an account!'))
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const user = await User.create({email, role, password: hashPassword})
        const cart = await User_cart.create({userId: user.id})
        const token = generateJWT(user.id, user.email, user.role)
        return res.json({token})
    }

    async login(req, res, next) {
        try {
            const {email, password} = req.body
            console.log(email)
            const user = await User.findOne({where: {email}})
            if (!user) {
                return next(ApiError.internal('User not found'))
            }
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) {
                return next(ApiError.internal("Wrong password!"))
            }
            const token = generateJWT(user.id, user.email, user.role)
            return res.json({token})
        } catch (e) {
            next (ApiError.badRequest(e.message))
        }
    }

    async check(req,res, next) {
        const token = generateJWT(req.user.id, req.user.email, req.user.role)
        return res.json({token})
    }

    
    async update_user_email(req, res, next) {
        try {
            const {password, new_email} = req.body
            let token = req.headers.authorization.split(' ')[1]
            let email = parseJwt(token).email
            let user = await User.findOne({where: {email}})
            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) {
                return next(ApiError.internal("Wrong password!"))
            }
            await db.query(`UPDATE users SET email = '${new_email}' where email = '${email}'`);
            email = new_email
            user = await User.findOne({where: {email}})
            token = generateJWT(user.id, user.email, user.role)
            return res.json({token})
        } catch (e) {
            next (ApiError.badRequest(e.message))
        }
    }
}

module.exports = new UserController()