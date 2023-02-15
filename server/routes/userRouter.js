const Router = require('express')
const router = new Router() //объект роутера
const userController = require('../controllers/userController') //подгрудаем контроллер
const authMiddleware = require('../middleware/authMiddleware')

// прописываем пути
router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/auth', authMiddleware, userController.check)


module.exports = router
