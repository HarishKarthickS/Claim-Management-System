import { NextResponse } from 'next/server';
import { emitToAll, emitToUser } from '../../../../socketServer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { event, data, userId } = body;

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event name is required' },
        { status: 400 }
      );
    }

    if (userId) {
      // Emit to specific user
      emitToUser(userId, event, data);
      return NextResponse.json({
        success: true,
        message: `Event '${event}' emitted to user ${userId}`
      });
    } else {
      // Emit to all connected clients
      emitToAll(event, data);
      return NextResponse.json({
        success: true,
        message: `Event '${event}' emitted to all clients`
      });
    }
  } catch (error) {
    console.error('Error emitting socket event:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to emit socket event', error: error.message },
      { status: 500 }
    );
  }
} 