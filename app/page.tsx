import { connection } from "next/server";

import { db } from "@/db";

export default async function Page() {
  await connection();

  const todos = await db.query.todos.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <h1>Todo list</h1>

      {todos.length === 0 ? (
        <p>Nenhum item cadastrado.</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <label>
                <input
                  defaultChecked={todo.completed}
                  disabled
                  type="checkbox"
                />
                {todo.title}
              </label>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
