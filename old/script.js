// Функция для получения списка всех групп (проектов)
// function fetchProjects() {
//   BX24.init(function () {
//     BX24.installFinish();
//     console.log('BX24 initialized successfully.');
//     var groups = [];
//     BX24.callMethod('sonet_group.get', {}, function (res) {
//       groups = res.data();
//       var selectBody = document.getElementById('projectSelect');
//       groups.forEach((group) => {
//         var newOption = new Option(group.NAME, group.ID);
//         selectBody.add(newOption);
//       });
//     });
//   });
// }

// Обработчик изменения выбора проекта
// document.getElementById('projectSelect').addEventListener('change', function () {
//   const selectedProjectId = this.value;
//   if (selectedProjectId) {
//     fetchTasksByProject(selectedProjectId);
//   } else {
//     clearTable(); // Очищаем таблицу, если проект не выбран
//   }
// });

// function fetchTasksByProject(projectId) {
//   BX24.callMethod(
//     'tasks.task.list',
//     {
//       filter: {
//         GROUP_ID: projectId,
//       },
//     },
//     function (res) {
//       console.log(res);
//       processTasks(res.answer.result.tasks); // Передаем массив задач
//     },
//   );
// }

// Функция для обработки задач и добавления их в таблицу
// function processTasks(tasks) {
//   console.log('tasks = ', tasks);
//   const tbody = document.querySelector('#tasksTable tbody');
//   let totalTimeEstimate = 0;
//   let totalTimeSpent = 0;

//   // Очищаем таблицу перед добавлением новых данных
//   tbody.innerHTML = '';

//   tasks.forEach((task) => {
//     const timeInHours = (task.timeEstimate || 0) / 3600;
//     const timespent = (task.timeSpentInLogs || 0) / 3600;
//     const row = document.createElement('tr');
//     row.innerHTML = `
//       <td>${task.title}</td>
//       <td>${projectSelect.options[projectSelect.selectedIndex].text}</td>
//       <td>${timeInHours.toFixed(2)}</td> <!-- Отображаем время с двумя знаками после запятой -->
//       <td>${timespent.toFixed(2)}</td> <!-- Отображаем время с двумя знаками после запятой -->
//       <td>${task.responsible.name}</td>
//   `;

//     // Добавляем обработчик события для клика
//     row.addEventListener('click', () => {
//       const userId = task.responsible.id;
//       const taskId = task.id;
//       const url = `/company/personal/user/${userId}/tasks/task/view/${taskId}/`;
//       BX24.openPath(url, function (result) {
//         console.log(result);
//       });
//     });

//     tbody.appendChild(row);
//     totalTimeEstimate += timeInHours;
//     totalTimeSpent += timespent;
//   });

//   // Добавление строки с итоговым временем
//   const totalRow = document.createElement('tr');
//   totalRow.className = 'totalRow';
//   totalRow.innerHTML = `
//   <td><strong>Итого</strong></td>
//   <td></td>
//   <td><strong>${totalTimeEstimate.toFixed(2)}</strong></td>
//   <td><strong>${totalTimeSpent.toFixed(2)}</strong></td>
//   <td></td>
// `;
//   tbody.appendChild(totalRow);

//   // Обновление итогового времени
//   const totalTime = document.getElementById('totalTime'); // Отображаем итоговое время
//   totalTime.textContent = '' + totalTimeEstimate.toFixed(2);
//   console.log(totalTimeEstimate + ' : ' + totalTimeSpent);
//   if (totalTimeSpent < totalTimeEstimate) {
//     totalTime.style.background = 'red';
//   } else {
//     totalTime.style.background = 'white';
//   }
// }

// Функция для очистки таблицы
// function clearTable() {
//   const tbody = document.querySelector('#tasksTable tbody');
//   tbody.innerHTML = '';
//   document.getElementById('totalTime').textContent = 0;
// }

// //Функция переключения вкладок
// function showTab(tab) {
//   const tasksTab = document.getElementById('tasksTab');
//   const settingsTab = document.getElementById('settingsTab');
//   if (tab === 'tasks') {
//     tasksTab.style.removeProperty('display');
//     settingsTab.style.display = 'none';
//   } else if (tab === 'settings') {
//     tasksTab.style.setProperty('display', 'none');
//     settingsTab.style.display = 'block';
//   }
// }

// function filterTable() {
//   const input = document.getElementById('tasksFilter');
//   const filter = input.value.toLowerCase();
//   const table = document.getElementById('tasksTable');
//   const rows = table.getElementsByTagName('tr');

//   // Проходим по всем строкам таблицы
//   for (let i = 1; i < rows.length - 1; i++) {
//     // Начинаем с 1, чтобы пропустить заголовок
//     const cells = rows[i].getElementsByTagName('td');
//     const taskCell = cells[4]; // Предполагаем, что "Задача" в первом столбце

//     if (taskCell) {
//       const textValue = taskCell.innerText;
//       // Скрываем или показываем строку в зависимости от фильтра
//       rows[i].style.display = textValue.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
//     }
//   }
// }

// function sortTable(columnIndex) {
//   const table = document.getElementById('tasksTable');
//   const tbody = table.querySelector('tbody');
//   const rows = Array.from(tbody.rows).slice(0, -1); // Получаем все строки, кроме итоговой

//   const isAscending = table.getAttribute('data-sort-order') === 'asc';

//   // Сортируем строки
//   rows.sort((a, b) => {
//     const aValue = parseFloat(a.cells[columnIndex].innerText);
//     const bValue = parseFloat(b.cells[columnIndex].innerText);
//     return isAscending ? aValue - bValue : bValue - aValue; // Сортировка по возрастанию или убыванию
//   });
//   const totalRow = tbody.querySelector('.totalRow');
//   totalRow.style.display = 'none';

//   // Удаляем старые строки и добавляем отсортированные
//   // Сначала добавляем отсортированные строки
//   rows.forEach((row) => {
//     if (row.style.display !== 'none') {
//       // Проверяем, что строка не скрыта
//       tbody.appendChild(row);
//     }
//   });

//   // Меняем порядок сортировки
//   table.setAttribute('data-sort-order', isAscending ? 'desc' : 'asc');

//   // Если сортировка по убыванию, перемещаем итоговую строку вниз
//   tbody.appendChild(totalRow); // Добавляем итоговую строку в конец
//   totalRow.style.display = ''; // Показываем итоговую строку
// }

// Загружаем проекты при загрузке страницы
// window.onload = () => {
//   fetchProjects();
//   var selectBody = document.getElementById('projectSelect');
//   selectBody.addEventListener('change', () => {
//     console.log(
//       'id = ' + selectBody.value + ' ' + ' name = ' + selectBody[selectBody.selectedIndex].text,
//     );
//   });
// };
