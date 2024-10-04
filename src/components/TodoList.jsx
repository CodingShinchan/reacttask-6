import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./TodoList.css"; // Import the CSS

const TodoList = () => {
  const [todoLists, setTodoLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [taskInputs, setTaskInputs] = useState({});
  const [draggedTask, setDraggedTask] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();

  const fetchTodoLists = async (user) => {
    if (user) {
      try {
        const querySnapshot = await getDocs(
          collection(db, `users/${user.uid}/todoLists`)
        );
        const fetchedLists = await Promise.all(
          querySnapshot.docs.map(async (listDoc) => {
            const tasksSnapshot = await getDocs(
              collection(db, `users/${user.uid}/todoLists/${listDoc.id}/tasks`)
            );
            const tasks = tasksSnapshot.docs.map((taskDoc) => ({
              id: taskDoc.id,
              ...taskDoc.data(),
            }));
            return {
              id: listDoc.id,
              ...listDoc.data(),
              tasks,
            };
          })
        );
        setTodoLists(fetchedLists);
      } catch (error) {
        console.error("Error fetching To-Do Lists: ", error);
      }
    }
  };

  const addTodoList = async () => {
    const user = getAuth().currentUser;
    if (newListName.trim() && user) {
      try {
        await addDoc(collection(db, `users/${user.uid}/todoLists`), {
          name: newListName,
          createdBy: user.email,
          createdAt: new Date(),
        });
        fetchTodoLists(user);
        setNewListName("");
      } catch (error) {
        console.error("Error adding To-Do List: ", error);
      }
    }
  };

  const handleTaskInputChange = (listId, field, value) => {
    setTaskInputs((prev) => ({
      ...prev,
      [listId]: { ...prev[listId], [field]: value },
    }));
  };

  const addTask = async (listId) => {
    const user = getAuth().currentUser;
    const newTask = taskInputs[listId];
    if (newTask?.title.trim() && user) {
      try {
        await addDoc(
          collection(db, `users/${user.uid}/todoLists/${listId}/tasks`),
          {
            ...newTask,
            priority: newTask.priority || "low",
            createdAt: new Date(),
          }
        );
        fetchTodoLists(user);
        setTaskInputs((prev) => ({
          ...prev,
          [listId]: {
            title: "",
            description: "",
            dueDate: "",
            priority: "low",
          },
        }));
      } catch (error) {
        console.error("Error adding task: ", error);
      }
    }
  };

  const updateTaskPriority = async (listId, taskId, newPriority) => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const taskRef = doc(
          db,
          `users/${user.uid}/todoLists/${listId}/tasks`,
          taskId
        );
        await updateDoc(taskRef, { priority: newPriority });
        fetchTodoLists(user);
      } catch (error) {
        console.error("Error updating task priority: ", error);
      }
    }
  };

  const moveTaskToAnotherList = async (
    fromListId,
    toListId,
    task,
    newPriority
  ) => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const newTaskData = { ...task, priority: newPriority };
        delete newTaskData.id;
        await addDoc(
          collection(db, `users/${user.uid}/todoLists/${toListId}/tasks`),
          newTaskData
        );

        await deleteDoc(
          doc(db, `users/${user.uid}/todoLists/${fromListId}/tasks`, task.id)
        );

        setTodoLists((prev) =>
          prev.map((list) =>
            list.id === fromListId
              ? {
                  ...list,
                  tasks: list.tasks.filter((t) => t.id !== task.id),
                }
              : list.id === toListId
              ? {
                  ...list,
                  tasks: [...list.tasks, { ...newTaskData, id: task.id }],
                }
              : list
          )
        );
      } catch (error) {
        console.error("Error moving task to another list: ", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleDragStart = (task, fromListId) => {
    setDraggedTask({ ...task, fromListId });
  };

  const handleDrop = async (toListId, newPriority = null) => {
    if (draggedTask) {
      const fromListId = draggedTask.fromListId;
      const isSameList = fromListId === toListId;

      if (newPriority) {
        if (isSameList) {
          await updateTaskPriority(fromListId, draggedTask.id, newPriority);
        } else {
          await moveTaskToAnotherList(
            fromListId,
            toListId,
            draggedTask,
            newPriority
          );
        }
      }
      setDraggedTask(null);
    }
  };

  const handleScrollOnDrag = (event) => {
    const SCROLL_THRESHOLD = 100;
    const scrollStep = 10;

    if (event.clientY < SCROLL_THRESHOLD) {
      window.scrollBy(0, -scrollStep);
    } else if (window.innerHeight - event.clientY < SCROLL_THRESHOLD) {
      window.scrollBy(0, scrollStep);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTodoLists(user);
      } else {
        setTodoLists([]);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <div
      className="todo-list-container"
      onDragOver={handleScrollOnDrag}
    >
      <div className="todo-app-wrapper">
        <div className="header">
          <h2>To-Do App</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>

        <div className="new-list-input">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Create new To-Do List"
          />
          <button onClick={addTodoList}>Add List</button>
        </div>

        <div className="todo-lists-grid">
          {todoLists.map((list) => (
            <div
              key={list.id}
              className="todo-list-card"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(list.id)}
            >
              <h3>{list.name}</h3>

              <div className="task-inputs">
                <input
                  type="text"
                  value={taskInputs[list.id]?.title || ""}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "title", e.target.value)
                  }
                  placeholder="Task Title"
                />
                <input
                  type="text"
                  value={taskInputs[list.id]?.description || ""}
                  onChange={(e) =>
                    handleTaskInputChange(
                      list.id,
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Task Description"
                />
                <input
                  type="date"
                  value={taskInputs[list.id]?.dueDate || ""}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "dueDate", e.target.value)
                  }
                />
                <select
                  value={taskInputs[list.id]?.priority || "low"}
                  onChange={(e) =>
                    handleTaskInputChange(list.id, "priority", e.target.value)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button onClick={() => addTask(list.id)}>Add Task</button>
              </div>

              {["low", "medium", "high"].map((priority) => (
                <div
                  key={priority}
                  onDrop={() => handleDrop(list.id, priority)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`task-priority-${priority}`}
                >
                  <h4>{priority} Priority</h4>
                  {list.tasks
                    .filter((task) => task.priority === priority)
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task, list.id)}
                        className="task-card"
                      >
                        <p className="task-title">{task.title}</p>
                        <p className="task-description">{task.description}</p>
                        <p className="task-dueDate">{task.dueDate}</p>
                        <p className="task-priority">{task.priority}</p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
