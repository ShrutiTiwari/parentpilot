
import React from 'react';
import { TodoItem } from "@/utils/dateGrouping";
import { cn } from "@/lib/utils";
import { CheckSquare, Square } from "lucide-react";

interface TodoChecklistProps {
  todos: TodoItem[];
  onTodoToggle: (todoId: string) => void;
}

export function TodoChecklist({ todos, onTodoToggle }: TodoChecklistProps) {
  /*console.log('TodoChecklist received props:', {
    hasTodos: Boolean(todos),
    todosLength: todos?.length,
    actualTodos: todos
  });
*/
  const handleTodoClick = (e: React.MouseEvent, todoId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Todo clicked:', todoId);
    onTodoToggle(todoId);
  };

  if (!todos || todos.length === 0) {
    //console.log('TodoChecklist returning null - no todos');
    return null;
  }

  //console.log('TodoChecklist rendering todos:', todos);

  return (
    <div className="mt-3 pt-2 border-t border-gray-200">
      <div className="text-xs font-semibold text-[#221F26]/80 mb-1.5">
        Tasks ({todos.length}):
      </div>
      <div className="space-y-1.5 pl-1">
        {todos.map((todo) => {
          //console.log('Rendering individual todo:', todo);
          return (
            <div 
              key={todo.id} 
              className="flex items-center gap-1.5 p-1.5 -mx-1 rounded-md bg-gray-50/80 hover:bg-gray-100 transition-colors"
              onClick={(e) => handleTodoClick(e, todo.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTodoClick(e as any, todo.id);
                }
              }}
            >
              <div className="shrink-0">
                {todo.completed ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-gray-400" />
                )}
              </div>
              <span 
                className={cn(
                  "text-xs cursor-pointer flex-1 select-none",
                  todo.completed ? "line-through text-gray-400" : "text-gray-700"
                )}
              >
                {todo.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
