// ----------------------
// Сервер администрирования
// ----------------------
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const adminApp = express();
const ADMIN_PORT = 8080;

adminApp.use(cors());
adminApp.use(express.json());
adminApp.use(express.static(path.join(__dirname))); // Обслуживание статических файлов для админки

const productsFilePath = path.join(__dirname, 'products.json');

// Добавление товара
adminApp.post('/api/products', (req, res) => {
    const newProduct = req.body;
    fs.readFile(productsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        const products = JSON.parse(data);
        newProduct.id = products.length ? products[products.length - 1].id + 1 : 1; // Автоинкремент ID
        products.push(newProduct);
        fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
            if (err) {
                return res.status(500).send('Ошибка записи файла');
            }
            res.status(201).send(newProduct);
        });
    });
});

// Обновление товара
   // Обновление товара
   adminApp.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updatedProduct = req.body;

    fs.readFile(productsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        const products = JSON.parse(data);
        const index = products.findIndex(product => product.id === parseInt(id));
        
        if (index === -1) {
            return res.status(404).send('Товар не найден');
        }

        // Обновляем только те поля, которые были переданы
        products[index] = { ...products[index], ...updatedProduct };
        
        fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
            if (err) {
                return res.status(500).send('Ошибка записи файла');
            }
            
            res.send(products[index]); // Возвращаем обновленный товар
        });
    });
});




// Удаление товара
adminApp.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    fs.readFile(productsFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        const products = JSON.parse(data);
        const index = products.findIndex(product => product.id === parseInt(id));
        if (index === -1) {
            return res.status(404).send('Товар не найден');
        }
        products.splice(index, 1);
        fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), err => {
            if (err) {
                return res.status(500).send('Ошибка записи файла');
            }
            res.status(204).send();
        });
    });
});

// Обработчик для админской страницы
adminApp.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Запуск сервера администрирования
adminApp.listen(ADMIN_PORT, () => {
    console.log(`Сервер администрирования запущен на порту ${ADMIN_PORT}`);
});
