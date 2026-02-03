var projectID;
const projectsData = {};
var allocatedProjectTime;
//Получение списка задач при выборе нового проекта
export function fetchTasksByProject(projectId) {
  projectID = projectId;
  // Получение списка всех задач
  BX24.callMethod(
    'tasks.task.list',
    {
      filter: {
        GROUP_ID: projectId,
      },
    },
    function (res) {
      processTasks(res.answer.result.tasks); // Передаем массив задач
      fillResponsibles(res.answer.result.tasks);
    },
  );

  //Запрос на получение данные, которые хранят установленное планируемое время
  BX24.callMethod(
    'app.option.get',
    {
      name: 'total_allocated_times',
    },
    function (result) {
      if (result.error()) {
        console.error('Ошибка при загрузке данных:', result.error());
      } else {
        const totalTimesString = result.answer.result.total_allocated_times;
        const totalTimes = totalTimesString ? JSON.parse(totalTimesString) : {}; // Преобразуем строку в объект
        Object.assign(projectsData, totalTimes);
        const totalTime = projectsData[projectId];
        if (totalTime == undefined) {
          document.getElementById('tasksHeaderTime').innerHTML = parseFloat('0').toFixed(2); // Устанавливаем значение в input
        } else {
          allocatedProjectTime = parseFloat(totalTime).toFixed(2);
          const element = document.getElementById('tasksHeaderTime');
          element.innerText = allocatedProjectTime; // Устанавливаем значение в input
        }
      }
    },
  );
}

// Функция получающая список ответственные за задачи проекта
export function fillResponsibles(tasks) {
  const resonsiblesBody = document.getElementById('responsiblesList');
  while (resonsiblesBody.options.length > 1) {
    resonsiblesBody.remove(1);
  }
  const responsibles = new Map();
  tasks.forEach((task) => {
    if (!responsibles.has(task.responsible.name)) {
      responsibles.set(task.responsible.id, task.responsible.name);
    }
  });
  responsibles.forEach((name, id) => {
    var newOption = new Option(name, id);
    resonsiblesBody.add(newOption);
  });
}

// Функция заполнения таблицы задачами
export function processTasks(tasks) {
  const tbody = document.querySelector('#tasksTable tbody');
  const projectSelect = document.getElementById('projectsList');
  let totalTimeEstimate = 0;
  let totalTimeSpent = 0;

  tbody.innerHTML = '';

  const timeByResponsible = {};

  tasks.forEach((task) => {
    const timeInHours = (task.timeEstimate || 0) / 3600;
    const timespent = (task.timeSpentInLogs || 0) / 3600;
    const responsibleName = task.responsible.name;

    if (!timeByResponsible[responsibleName]) {
      timeByResponsible[responsibleName] = 0;
    }
    timeByResponsible[responsibleName] += timespent;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${projectSelect.options[projectSelect.selectedIndex].text}</td>
        <td>${task.title}</td>
        <td>${task.responsible.name}</td>
        <td>${timeInHours.toFixed(2)}</td> <!-- Отображаем время с двумя знаками после запятой -->
        <td>${timespent.toFixed(2)}</td> <!-- Отображаем время с двумя знаками после запятой -->
    `;
    row.style.cursor = 'pointer';

    row.classList.add('table-task');
    // Открытие задачи по клику на соответствующую строку
    row.addEventListener('click', () => {
      const userId = task.responsible.id;
      const taskId = task.id;
      const url = `/company/personal/user/${userId}/tasks/task/view/${taskId}/`;
      BX24.openPath(url, function (result) {
        console.log(result);
      });
    });

    tbody.appendChild(row);
    totalTimeEstimate += timeInHours;
    totalTimeSpent += timespent;
  });

  // Добавление строки с итоговым временем
  const totalRow = document.createElement('tr');
  totalRow.className = 'totalRow';
  totalRow.innerHTML = `
    <td><strong>Итого</strong></td>
    <td></td>
    <td></td>
    <td><strong>${totalTimeEstimate.toFixed(2)}</strong></td>
    <td><strong>${totalTimeSpent.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);

  // Обновление итогового времени
  const totalTime = document.getElementById('tasksHeaderTime');
  if (totalTimeSpent > allocatedProjectTime) {
    totalTime.style.background = 'red';
  } else {
    totalTime.style.background = 'white';
  }
  const tasksHeaderFactTime = document.getElementById('tasksHeaderFactTime');
  tasksHeaderFactTime.innerHTML = totalTimeSpent.toFixed(2);

  createPieChart(timeByResponsible);
  createBarChart(timeByResponsible);
}

function createPieChart(timeByResponsible) {
  const ctx = document.getElementById('timeChart').getContext('2d');
  const labels = Object.keys(timeByResponsible);
  const data = Object.values(timeByResponsible);

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Затраченное время (часы)',
          data: data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Распределение времени по исполнителям',
        },
      },
    },
  });
}

function createBarChart(timeByResponsible) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.id = 'barChart';
  ctx.canvas.width = 400;
  ctx.canvas.height = 400;
  document.querySelector('.container').appendChild(ctx.canvas);

  const labels = Object.keys(timeByResponsible);
  const data = Object.values(timeByResponsible);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Затраченное время (часы)',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Затраченное время по исполнителям',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
