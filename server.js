const express = require('express')
const fetch = require('node-fetch')
const redis = require('redis')

const PORT = process.env.PORT || 3000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)

const app = express()

app.set('view engine', 'pug')
app.set('views', './views')

app.use(express.static(__dirname + '/public'))

const url = "https://api-louiskevin.herokuapp.com/products"

//using middleware
const getProduct = async (req, res) => {
    try {
        const response = await fetch(url)
        const products = await response.json()

        //Add products to redis store
        products.forEach((product) => {
            client.lpush("products", JSON.stringify(product))
        })

        showProduct(req, res, products)

    } catch (error) {
        console.log(error)
        res.status(500)
    }
}

const showProduct = (req, res, products) => {
    res.render('productCard', { products: products })
}

const checkCache = (req, res, next) => {
    client.lrange("products", 0, -1, (products) => {
        if (products === null) next()
        else showProduct(req, res, products)
    })
}

app.get('/', checkCache, getProduct)

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
})
