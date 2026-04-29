import * as SQLite from 'expo-sqlite';

type TransactionRow = {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  date: string;
};

type BudgetRow = {
  id: number;
  category: string;
  limit: number;
  spent?: number;
  date?: string;
};

type DebtRow = {
  id: number;
  name: string;
  amount: number;
  status: 'active' | 'paid';
};

type TodoRow = {
  id: number;
  title: string;
  description?: string;
  color?: string;
  reminder?: string;
  dueDate?: string;
  reminderTime?: string;
  done: boolean;
};

let database: SQLite.SQLiteDatabase | null = null;
let databaseInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const initializeSchema = async (db: SQLite.SQLiteDatabase) => {
  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      date TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL UNIQUE,
      limit_amount REAL NOT NULL,
      spent REAL DEFAULT 0,
      date TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL
    );
  `);

  // Check if todos table exists and has all required columns
  try {
    const todosCheck = await db.getAllAsync(
      'PRAGMA table_info(todos)'
    );

    // If table doesn't exist or is missing columns, recreate it
    if (!todosCheck || todosCheck.length === 0) {
      // Table doesn't exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS todos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#FFD54F',
          reminder TEXT,
          dueDate TEXT,
          reminderTime TEXT,
          done INTEGER DEFAULT 0
        );
      `);
    } else {
      // Check if dueDate column exists
      const hasDueDate = todosCheck.some((col: any) => col.name === 'dueDate');
      const hasReminderTime = todosCheck.some((col: any) => col.name === 'reminderTime');

      if (!hasDueDate || !hasReminderTime) {
        // Migration: Add missing columns
        if (!hasDueDate) {
          await db.execAsync('ALTER TABLE todos ADD COLUMN dueDate TEXT');
        }
        if (!hasReminderTime) {
          await db.execAsync('ALTER TABLE todos ADD COLUMN reminderTime TEXT');
        }
      }
    }
  } catch (tableError) {
    console.log('Recreating todos table due to error:', tableError);
    // If table check fails, try to create table fresh
    try {
      await db.execAsync('DROP TABLE IF EXISTS todos');
    } catch {
      // Ignore drop error
    }
    await db.execAsync(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#FFD54F',
        reminder TEXT,
        dueDate TEXT,
        reminderTime TEXT,
        done INTEGER DEFAULT 0
      );
    `);
  }
};

export const getDatabase = async () => {
  if (database) return database;

  if (!databaseInitPromise) {
    databaseInitPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('finance.db');
        await initializeSchema(db);
        database = db;
        return db;
      } catch (error) {
        databaseInitPromise = null;
        console.error('Failed to open database:', error);
        throw error;
      }
    })();
  }

  database = await databaseInitPromise;
  return database;
};

export const initDB = async () => {
  try {
    await getDatabase();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Helper functions for database operations
export const addTransaction = async (transaction: any): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO transactions (title, amount, type, category, date) VALUES (?, ?, ?, ?, ?)`,
      [transaction.title, transaction.amount, transaction.type, transaction.category, transaction.date]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw error;
  }
};

export const getTransactions = async (): Promise<TransactionRow[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY date DESC');
    return result;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
};

export const addBudget = async (budget: any): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO budgets (category, limit_amount, spent, date) VALUES (?, ?, ?, ?)`,
      [budget.category, budget.limit, budget.spent || 0, budget.date]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to add budget:', error);
    throw error;
  }
};

export const getBudgets = async (): Promise<BudgetRow[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<BudgetRow>('SELECT * FROM budgets');
    return result;
  } catch (error) {
    console.error('Failed to get budgets:', error);
    return [];
  }
};

export const addDebt = async (debt: any): Promise<number> => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO debts (name, amount, status) VALUES (?, ?, ?)`,
      [debt.name, debt.amount, debt.status]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to add debt:', error);
    throw error;
  }
};

export const getDebts = async (): Promise<DebtRow[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<DebtRow>('SELECT * FROM debts');
    return result;
  } catch (error) {
    console.error('Failed to get debts:', error);
    return [];
  }
};

export const addTodo = async (todo: any): Promise<number> => {
  try {
    const db = await getDatabase();
    
    // Ensure database is initialized
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Use runAsync without specifying id - let SQLite auto-increment it
    const result = await db.runAsync(
      `INSERT INTO todos (title, description, color, reminder, dueDate, reminderTime, done) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        todo.title || '',
        todo.description || '',
        todo.color || '#FFD54F',
        todo.reminder || '',
        todo.dueDate || '',
        todo.reminderTime || '',
        todo.done ? 1 : 0
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to add todo:', error);
    throw error;
  }
};

export const getTodos = async (): Promise<TodoRow[]> => {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync<TodoRow>('SELECT * FROM todos');
    return result;
  } catch (error) {
    console.error('Failed to get todos:', error);
    return [];
  }
};

export const updateTodo = async (id: number, updates: any) => {
  try {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if ('done' in updates) {
      fields.push('done = ?');
      values.push(updates.done ? 1 : 0);
    }
    if ('title' in updates) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if ('description' in updates) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if ('color' in updates) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if ('reminder' in updates) {
      fields.push('reminder = ?');
      values.push(updates.reminder);
    }
    if ('dueDate' in updates) {
      fields.push('dueDate = ?');
      values.push(updates.dueDate);
    }
    if ('reminderTime' in updates) {
      fields.push('reminderTime = ?');
      values.push(updates.reminderTime);
    }

    if (fields.length === 0) return;

    values.push(id);
    const query = `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`;

    const result = await db.runAsync(query, values);
    return result;
  } catch (error) {
    console.error('Failed to update todo:', error);
    throw error;
  }
};

export const deleteTodo = async (id: number) => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
    return result;
  } catch (error) {
    console.error('Failed to delete todo:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: number) => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    return result;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
};

export const deleteBudget = async (id: number) => {
  try {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
    return result;
  } catch (error) {
    console.error('Failed to delete budget:', error);
    throw error;
  }
};

// Update budget spent based on today's transactions
export const updateBudgetSpent = async () => {
  try {
    const db = await getDatabase();
    const todayDate = new Date().toLocaleDateString('id-ID');
    
    // Get all budgets
    const budgets: any[] = await db.getAllAsync('SELECT * FROM budgets');
    
    // For each budget, calculate today's expenses for that category
    for (const budget of budgets) {
      const expenses: any[] = await db.getAllAsync(
        'SELECT SUM(amount) as total FROM transactions WHERE category = ? AND type = ? AND date = ?',
        [budget.category, 'expense', todayDate]
      );
      
      const spent = expenses[0]?.total || 0;
      
      // Update budget spent
      await db.runAsync(
        'UPDATE budgets SET spent = ? WHERE id = ?',
        [spent, budget.id]
      );
    }
    
    console.log('Budget spent updated successfully');
  } catch (error) {
    console.error('Failed to update budget spent:', error);
  }
};
