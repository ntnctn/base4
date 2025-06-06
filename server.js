const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { WebSocketServer } = require('ws'); 
const { createServer } = require('http'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Чтение данных о продуктах 
function readProductsData() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Ошибка чтения файла products.json:', err);
        return []; // Пустой массив в случае ошибки
    }
}

// GraphQL Schema
const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
  }

  type Query {
    products(fields: [String]): [Product]
  }
`);

// GraphQL Resolver
const root = {
    products: ({ fields }) => {
        const products = readProductsData(); // Получаем данные из файла

        if (!fields || fields.length === 0) {
            return products; // Возвращаем все поля, если не указано конкретных
        }

        return products.map(product => {
            const selectedFields = {};
            fields.forEach(field => {
                if (product.hasOwnProperty(field)) {
                    selectedFields[field] = product[field];
                }
            });
            return selectedFields;
        });
    }
};

// GraphQL Endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true, 
}));

// Обработчик корневого пути для пользовательского интерфейса
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Создаем HTTP сервер
const server = createServer(app);

// Создаем WebSocket сервер
const wss = new WebSocketServer({ server });

// 
const clients = new Set();

wss.on('connection', ws => {
    console.log('Client connected');
    clients.add(ws); 

    ws.on('message', message => {
        console.log(`Received message: ${message}`);

        
        clients.forEach(client => {
            if (client !== ws && client.readyState === 1) { 
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws); 
    });

    ws.on('error', error => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});


// Запуск сервера
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
