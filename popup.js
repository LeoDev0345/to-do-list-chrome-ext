//verifier si le document est chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
//initialiser l'application
function initializeApp() {
  const tasksList = document.getElementById('tasksList');
  const addTaskButton = document.getElementById('addTask');
  const taskTemplate = document.getElementById('taskTemplate');
  const dayTemplate = document.getElementById('dayTemplate');
  const dateSelector = document.getElementById('dateSelector');
  const selectedDateDisplay = document.getElementById('selectedDateDisplay');
  const viewSelector = document.getElementById('viewSelector');
  const dayView = document.getElementById('dayView');
  const weekView = document.getElementById('weekView');
  const weekGrid = document.getElementById('weekGrid');
  const prevButton = document.getElementById('prevDays');
  const nextButton = document.getElementById('nextDays');
  const dayDetailView = document.getElementById('dayDetailView');
  const backToWeekButton = document.getElementById('backToWeek');
  const dayDetailTitle = document.querySelector('.day-detail-title');
  const dayDetailTasks = document.querySelector('.day-detail-tasks');

  // verifier si les éléments du DOM sont présents
  if (!tasksList || !addTaskButton || !taskTemplate || !dayTemplate || !dateSelector || 
      !selectedDateDisplay || !viewSelector || !dayView || !weekView || !weekGrid || 
      !prevButton || !nextButton || !dayDetailView || !backToWeekButton || 
      !dayDetailTitle || !dayDetailTasks) {
    console.error('Certains éléments du DOM sont manquants');
    return;
  }

  // Initialiser la date du jour
  const today = new Date().toISOString().split('T')[0];
  dateSelector.value = today;
  updateDateDisplay(today);

  // Charger les tâches sauvegardées
  loadTasks();

  // Gérer le changement de vue
  viewSelector.addEventListener('change', () => {
    if (viewSelector.value === 'week') {
      dayView.classList.add('hidden');
      weekView.classList.remove('hidden');
      loadWeekView();
      updateNavigationButtons();
    } else {
      dayView.classList.remove('hidden');
      weekView.classList.add('hidden');
      loadTasks();
    }
  });

  // Gérer le changement de date
  dateSelector.addEventListener('change', () => {
    updateDateDisplay(dateSelector.value);
    if (viewSelector.value === 'week') {
      loadWeekView();
    } else {
      loadTasks();
    }
  });

  // Gérer la navigation entre les jours
  prevButton.addEventListener('click', () => navigateDays('prev'));
  nextButton.addEventListener('click', () => navigateDays('next'));

  // Ajouter une nouvelle tâche
  addTaskButton.addEventListener('click', () => {
    if (dayDetailView.classList.contains('hidden')) {
      if (viewSelector.value === 'week') {
        addNewTaskToWeek();
      } else {
        addNewTask();
      }
    } else {
      const taskElement = taskTemplate.content.cloneNode(true);
      const taskItem = taskElement.querySelector('.task-item');
      const taskText = taskElement.querySelector('.task-text');
      const taskCheckbox = taskElement.querySelector('.task-checkbox');
      const deleteButton = taskElement.querySelector('.delete-task');

      taskText.addEventListener('blur', () => {
        saveTasks();
      });

      taskCheckbox.addEventListener('change', () => {
        taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
        taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
        saveTasks();
      });

      deleteButton.addEventListener('click', () => {
        taskItem.remove();
        saveTasks();
      });

      dayDetailTasks.appendChild(taskElement);
      taskText.focus();
    }
  });

  let currentStartIndex = 0;
  let selectedDetailDate = null;
//fonction pour mettre à jour la date
  function updateDateDisplay(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDateDisplay.textContent = date.toLocaleDateString('fr-FR', options);
  }

  function getWeekDates(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);
      weekDates.push(currentDate.toISOString().split('T')[0]);
    }

    return weekDates.slice(currentStartIndex, currentStartIndex + 3);
  }
//fonction pour mettre à jour les boutons de navigation
  function updateNavigationButtons() {
    const prevButton = document.getElementById('prevDays');
    const nextButton = document.getElementById('nextDays');
    
    if (prevButton) {
      prevButton.disabled = currentStartIndex === 0;
    }
    
    if (nextButton) {
      nextButton.disabled = currentStartIndex >= 4;
    }
  }
//fonction pour naviguer entre les jours
  function navigateDays(direction) {
    if (direction === 'prev' && currentStartIndex > 0) {
      currentStartIndex--;
    } else if (direction === 'next' && currentStartIndex < 4) {
      currentStartIndex++;
    }
    updateNavigationButtons();
    loadWeekView();
  }
//fonction pour ajouter une nouvelle tâche à la semaine
  function addNewTaskToWeek() {
    const selectedDate = dateSelector.value;
    const weekDates = getWeekDates(selectedDate);
    const currentDayElement = weekGrid.querySelector(`[data-date="${selectedDate}"]`);
    
    if (currentDayElement) {
      const dayTasks = currentDayElement.querySelector('.day-tasks');
      const taskElement = taskTemplate.content.cloneNode(true);
      const taskItem = taskElement.querySelector('.task-item');
      const taskText = taskElement.querySelector('.task-text');
      const taskCheckbox = taskElement.querySelector('.task-checkbox');
      const deleteButton = taskElement.querySelector('.delete-task');

      // Gérer la modification du texte
      taskText.addEventListener('blur', () => {
        saveTasks();
      });

      // Gérer la case à cocher
      taskCheckbox.addEventListener('change', () => {
        taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
        taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
        saveTasks();
      });

      // Gérer la suppression
      deleteButton.addEventListener('click', () => {
        taskItem.remove();
        saveTasks();
      });

      dayTasks.appendChild(taskElement);
      taskText.focus();
    }
  }
//fonction pour charger la vue hebdomadaire
  function loadWeekView() {
    const selectedDate = dateSelector.value;
    const weekDates = getWeekDates(selectedDate);
    weekGrid.innerHTML = '';

    chrome.storage.sync.get(['tasksByDate'], (result) => {
      const tasksByDate = result.tasksByDate || {};

      weekDates.forEach(date => {
        const dayElement = dayTemplate.content.cloneNode(true);
        const dayContainer = dayElement.querySelector('.week-day');
        const dayName = dayElement.querySelector('.day-name');
        const dayDate = dayElement.querySelector('.day-date');
        const dayTasks = dayElement.querySelector('.day-tasks');

        const currentDate = new Date(date);
        dayName.textContent = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' });
        dayDate.textContent = currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        
        dayContainer.setAttribute('data-date', date);

        // Ajouter l'événement de clic pour ouvrir la vue détaillée
        dayContainer.addEventListener('click', () => {
          selectedDetailDate = date;
          showDayDetail(date, tasksByDate[date] || []);
        });

        const tasks = tasksByDate[date] || [];
        tasks.forEach(task => {
          const taskElement = taskTemplate.content.cloneNode(true);
          const taskItem = taskElement.querySelector('.task-item');
          const taskText = taskElement.querySelector('.task-text');
          const taskCheckbox = taskElement.querySelector('.task-checkbox');
          const deleteButton = taskElement.querySelector('.delete-task');

          taskText.value = task.text;
          taskCheckbox.checked = task.completed;
          if (task.completed) {
            taskText.style.textDecoration = 'line-through';
            taskText.style.color = '#999';
          }

          // Gérer la modification du texte
          taskText.addEventListener('blur', () => {
            saveTasks();
          });

          // Gérer la case à cocher
          taskCheckbox.addEventListener('change', () => {
            taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
            taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
            saveTasks();
          });

          // Gérer la suppression
          deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher la propagation du clic
            taskItem.remove();
            saveTasks();
          });

          dayTasks.appendChild(taskElement);
        });

        weekGrid.appendChild(dayElement);
      });
    });
  }
//fonction pour afficher la vue détaillée
  function showDayDetail(date, tasks) {
    const currentDate = new Date(date);
    dayDetailTitle.textContent = currentDate.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    dayDetailTasks.innerHTML = '';
    tasks.forEach(task => {
      const taskElement = taskTemplate.content.cloneNode(true);
      const taskItem = taskElement.querySelector('.task-item');
      const taskText = taskElement.querySelector('.task-text');
      const taskCheckbox = taskElement.querySelector('.task-checkbox');
      const deleteButton = taskElement.querySelector('.delete-task');

      taskText.value = task.text;
      taskCheckbox.checked = task.completed;
      if (task.completed) {
        taskText.style.textDecoration = 'line-through';
        taskText.style.color = '#999';
      }

      // Gérer la modification du texte
      taskText.addEventListener('blur', () => {
        saveTasks();
      });

      // Gérer la case à cocher
      taskCheckbox.addEventListener('change', () => {
        taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
        taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
        saveTasks();
      });

      // Gérer la suppression
      deleteButton.addEventListener('click', () => {
        taskItem.remove();
        saveTasks();
      });

      dayDetailTasks.appendChild(taskElement);
    });

    weekView.classList.add('hidden');
    dayDetailView.classList.remove('hidden');
  }
//fonction pour retourner à la vue hebdomadaire
  backToWeekButton.addEventListener('click', () => {
    dayDetailView.classList.add('hidden');
    weekView.classList.remove('hidden');
  });
//fonction pour ajouter une nouvelle tâche          
  function addNewTask() {
    const taskElement = taskTemplate.content.cloneNode(true);
    const taskItem = taskElement.querySelector('.task-item');
    const taskContent = taskElement.querySelector('.task-content');
    const taskText = taskElement.querySelector('.task-text');
    const taskCheckbox = taskElement.querySelector('.task-checkbox');
    const deleteButton = taskElement.querySelector('.delete-task');

    if (!taskItem || !taskText || !taskCheckbox || !deleteButton) {
      console.error('Éléments de tâche manquants');
      return;
    }

    // Gérer la modification du texte
    taskText.addEventListener('blur', () => {
      saveTasks();
    });

    // Gérer la case à cocher
    taskCheckbox.addEventListener('change', () => {
      taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
      taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
      saveTasks();
    });

    // Gérer la suppression
    deleteButton.addEventListener('click', () => {
      taskItem.remove();
      saveTasks();
    });

    tasksList.appendChild(taskElement);
    taskText.focus();
  }
//fonction pour enregistrer les tâches
  function saveTasks() {
    const selectedDate = dateSelector.value;
    const tasks = [];
    
    if (viewSelector.value === 'week') {
      const weekDates = getWeekDates(selectedDate);
      const tasksByDate = {};
      
      weekDates.forEach(date => {
        const dayElement = weekGrid.querySelector(`[data-date="${date}"]`);
        if (dayElement) {
          const dayTasks = [];
          dayElement.querySelectorAll('.task-item').forEach(taskItem => {
            const taskText = taskItem.querySelector('.task-text').value;
            const isCompleted = taskItem.querySelector('.task-checkbox').checked;
            dayTasks.push({ text: taskText, completed: isCompleted });
          });
          tasksByDate[date] = dayTasks;
        }
      });
      
      chrome.storage.sync.set({ tasksByDate });
    } else {
      document.querySelectorAll('.task-item').forEach(taskItem => {
        const taskText = taskItem.querySelector('.task-text').value;
        const isCompleted = taskItem.querySelector('.task-checkbox').checked;
        tasks.push({ text: taskText, completed: isCompleted });
      });
      
      chrome.storage.sync.get(['tasksByDate'], (result) => {
        const tasksByDate = result.tasksByDate || {};
        tasksByDate[selectedDate] = tasks;
        chrome.storage.sync.set({ tasksByDate });
      });
    }
  }
//fonction pour charger les tâches  
  function loadTasks() {
    const selectedDate = dateSelector.value;
    tasksList.innerHTML = ''; // Vider la liste actuelle

    chrome.storage.sync.get(['tasksByDate'], (result) => {
      const tasksByDate = result.tasksByDate || {};
      const tasks = tasksByDate[selectedDate] || [];

      tasks.forEach(task => {
        const taskElement = taskTemplate.content.cloneNode(true);
        const taskItem = taskElement.querySelector('.task-item');
        const taskText = taskElement.querySelector('.task-text');
        const taskCheckbox = taskElement.querySelector('.task-checkbox');
        const deleteButton = taskElement.querySelector('.delete-task');

        taskText.value = task.text;
        taskCheckbox.checked = task.completed;
        if (task.completed) {
          taskText.style.textDecoration = 'line-through';
          taskText.style.color = '#999';
        }

        // Gérer la modification du texte
        taskText.addEventListener('blur', () => {
          saveTasks();
        });

        // Gérer la case à cocher
        taskCheckbox.addEventListener('change', () => {
          taskText.style.textDecoration = taskCheckbox.checked ? 'line-through' : 'none';
          taskText.style.color = taskCheckbox.checked ? '#999' : '#37352f';
          saveTasks();
        });

        // Gérer la suppression
        deleteButton.addEventListener('click', () => {
          taskItem.remove();
          saveTasks();
        });

        tasksList.appendChild(taskElement);
      });
    });
  }
} 