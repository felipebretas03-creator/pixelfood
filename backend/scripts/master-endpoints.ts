export const masterEndpoints = `
// ==========================================
// MASTER ADMIN ROUTES
// ==========================================

const masterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'owner' || !decoded.isMaster) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

app.get('/api/master/restaurants', masterMiddleware, async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        settings: true,
        orders: { select: { id: true, total: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform data for the frontend
    const data = restaurants.map(r => {
      const ordersCount = r.orders.length;
      const totalRevenue = r.orders.reduce((acc, o) => acc + o.total, 0);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        slug: r.slug,
        isMaster: r.isMaster,
        active: r.active,
        createdAt: r.createdAt,
        storeName: r.settings?.storeName || r.name,
        ordersCount,
        totalRevenue
      };
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar restaurantes' });
  }
});

app.post('/api/master/restaurants/:id/toggle', masterMiddleware, async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });
    
    if (restaurant.isMaster) return res.status(400).json({ error: 'Não é possível bloquear o Master' });
    
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { active: !restaurant.active }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

`;
