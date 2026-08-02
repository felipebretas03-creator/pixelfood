"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Permitir todos os origens por enquanto
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ==========================================
// SOCKET.IO REALTIME EVENTS
// ==========================================
io.on('connection', (socket) => {
    console.log('🔗 Novo cliente conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('❌ Cliente desconectado:', socket.id);
    });
});
// ==========================================
// ROUTES
// ==========================================
app.get('/', (req, res) => {
    res.send('PixelFood API is running! 🚀');
});
// --- Settings ---
app.get('/api/settings', async (req, res) => {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
        settings = await prisma.settings.create({ data: {} });
    }
    res.json(settings);
});
// --- Products ---
app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
});
app.get('/api/products/:id', async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: req.params.id }
    });
    if (!product)
        return res.status(404).json({ error: 'Not found' });
    res.json(product);
});
app.post('/api/products', async (req, res) => {
    try {
        const product = await prisma.product.create({ data: req.body });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(400).json({ error: 'Erro ao criar produto' });
    }
});
// --- Orders ---
app.get('/api/orders', async (req, res) => {
    const orders = await prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
});
app.post('/api/orders', async (req, res) => {
    try {
        const { items, ...orderData } = req.body;
        // Criar o pedido e seus itens
        const order = await prisma.order.create({
            data: {
                ...orderData,
                items: {
                    create: items
                }
            },
            include: { items: true }
        });
        // Emitir evento para o painel
        io.emit('new_order', order);
        res.status(201).json(order);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao criar pedido' });
    }
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});
