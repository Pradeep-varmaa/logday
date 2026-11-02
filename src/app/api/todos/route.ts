import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  dbGetTodos,
  dbCreateTodo,
  dbToggleTodo,
  dbDeleteTodo,
  dbClearCompletedTodos,
} from '@/lib/db/queries';

const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const ToggleTodoSchema = z.object({
  id: z.string().uuid(),
  is_completed: z.boolean(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const incompleteOnly = searchParams.get('incomplete') === 'true';
    const todos = await dbGetTodos(incompleteOnly);
    return NextResponse.json(todos);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateTodoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const created = await dbCreateTodo(parsed.data.title, parsed.data.priority);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = ToggleTodoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const updated = await dbToggleTodo(parsed.data.id, parsed.data.is_completed);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const clearCompleted = searchParams.get('clearCompleted') === 'true';

    if (clearCompleted) {
      const deletedCount = await dbClearCompletedTodos();
      return NextResponse.json({ success: true, count: deletedCount });
    }

    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing todo id' }, { status: 400 });
    }

    await dbDeleteTodo(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
