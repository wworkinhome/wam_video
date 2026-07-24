import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// P2002 (unique constraint) y P2003 (FK inexistente) son los únicos errores de Prisma
// que un cliente puede provocar con datos inválidos; el resto son bugs y deben seguir
// siendo un 500 sin transformar.
export async function handlePrismaWrite<T>(operation: () => Promise<T>, conflictMessage: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(conflictMessage);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('One or more referenced entities do not exist');
      }
    }
    throw error;
  }
}
