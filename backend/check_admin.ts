import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
  
  const admin = users.find(u => u.email === 'admin@admin.com');
  if (admin) {
    const isMatch = await bcrypt.compare('Wlademarcosgosotoso1234@', admin.password);
    console.log('Does password match?', isMatch);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
