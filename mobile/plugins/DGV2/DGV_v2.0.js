/**
 *
 * @author Bondarenko Oleg
 * @class DataGridView 
 * @description  DataGridView принимает JSON и отрисовует таблицу
 * с возможностью указания имён столбцов, ограничения количества столбцов и строк, нумерации строк, ограничения выводимых строк.
 * @returns {table}  заменяет содержимое обёртки в которую вписывается таблицей с данными, ID обёртки задается
 * параметром wrapperId
 * @example Пример использования: 
 *     $.getJSON('./json.json', function(data) {
 *              DGV2.dataGrid({
 *                  wrapperId: 'newDv',
 *                  columnsName:{"id":"ID","datetime":"ДатаВремя","info":""},
 *                  jsonData: data,
 *                  maxLength: "200", //максимальное количество строк
 *                  zebraRows: "true",
 *                  callBack: alert //функции callback передается ячйка по которой было вызвано событие
 *              });
 *          });
 */
function $$(id)
{                    

    return document.getElementById(id);
}
/*
 * 
 */
var DGV2 =
        {
            dataGrid: function(param)
            {

                var wrapper = $$(param['wrapperId']),
                        columnsName = param['columnsName'],
                        numeration = param['numeration'] || false,
                        callBack = param['callBack'],
                        json = param['jsonData'],
                        maxLength = param['maxLength'] || param['jsonData'].length,
                        table = document.createElement('table'),
                        thead = document.createElement('thead'),
                        tbody = document.createElement('tbody'),
                        tr = document.createElement('tr'),
                        zebraRows = param['zebraRows'], //зебра в строках
                        textArea = [],
                        cellWidth=param['cellWidth']||'';
                if (!json)
                {
                    var json = [],
                    temp = {};
                    for (var i in columnsName)
                    {
                        temp[i]='';
                    }
                    json.push(temp);
                    console.log(json);
                }        
                if (numeration) //нумерация строк
                {
                    var th = document.createElement('th');
                    th.innerHTML = '№';
                    tr.appendChild(th);
                }
                //функция изменения размера строк
                for (var i in columnsName)
                {
                    
                        var th = document.createElement('th'),
                            input = document.createElement('input');
//                          ширина поля
                        if (cellWidth[i])
                        {
                            th.width = cellWidth[i]+'%';
                        }
                        th.id = i;
                        input.type = 'none';
                        input.style.display = 'none';
                        var textColumn = document.createElement('a'),
                                serchButton = document.createElement('span');

                        textColumn.innerHTML = columnsName[i];
                        serchButton.innerHTML = ' &nbsp; ✐';
                        serchButton.onclick = function() {
                            DGV2.showHideChildNodes(this);
                        };
                        textColumn.onclick = function()
                        {
                            DGV2.clearTHclassNames();
                            var tBody = this.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('tbody')[0],
                                    grid = this.parentNode.parentNode.parentNode.parentNode,
                                    cellNumber = this.parentNode.cellIndex;
                            var rowsArray = [];
                            for (var i = 0; i < tBody.children.length; i++) {
                                rowsArray.push(tBody.children[i]);
                            }
                            var testVal = rowsArray[0].getElementsByTagName('td')[cellNumber].innerText;
                            //проверка типа данных
                            var type, compare;
                            if (parseFloat(testVal) == testVal)
                                type = 'number';
                            else
                                type = 'string';

                            if (this.getAttribute('sort-direction') === 'D' || this.getAttribute('sort-direction') === null)
                            {
                                this.setAttribute('sort-direction', 'U');
                                type += 'U';
                                this.className = 'dataGridviewSortD';
                            }
                            else
                            {
                                this.setAttribute('sort-direction', 'D');
                                type += 'D';
                                this.className = 'dataGridviewSortU';
                            }
                            switch (type) {
                                case 'numberU':
                                    compare = function(rowA, rowB) {
                                        return rowA.cells[cellNumber].innerHTML - rowB.cells[cellNumber].innerHTML;
                                    };
                                    break;
                                case 'stringU':
                                    compare = function(rowA, rowB) {
                                        return rowA.cells[cellNumber].innerHTML > rowB.cells[cellNumber].innerHTML ? 1 : -1;
                                    };
                                    break;
                                case 'numberD':
                                    compare = function(rowA, rowB) {
                                        return rowA.cells[cellNumber].innerHTML + rowB.cells[cellNumber].innerHTML;
                                    };
                                    break;
                                case 'stringD':
                                    compare = function(rowA, rowB) {
                                        return rowA.cells[cellNumber].innerHTML < rowB.cells[cellNumber].innerHTML ? 1 : -1;
                                    };
                                    break;
                            }
                            rowsArray.sort(compare);
                            grid.removeChild(tBody);
                            while (tBody.firstChild) {
                                tbody.removeChild(tBody.firstChild);
                            }
                            // добавить результат в нужном порядке в TBODY
                            for (var i = 0; i < rowsArray.length; i++) {
                                tBody.appendChild(rowsArray[i]);
                            }
                            grid.appendChild(tBody);
                        };
                        textArea.push(input.id = 'DGVColumn' + i);
                        th.appendChild(textColumn);
                        th.appendChild(input);
                        th.appendChild(serchButton);
                        tr.appendChild(th);
                    
                }
                thead.appendChild(tr);
                table.appendChild(thead);
                for (i = 0; i < maxLength; i++)
                {
                    var trBody = document.createElement('tr');
                    trBody.className = 'visible';
                    if (numeration) //нумерация строк
                    {
                        var td = document.createElement('td');
                        td.innerHTML = (i + 1);
                        trBody.appendChild(td);
                    }
                    for (var key in columnsName)
                    {

                        var td = document.createElement('td');
                        td.innerHTML = json[i][key];
                        trBody.appendChild(td);
                    }
                    tbody.appendChild(trBody);

                }
                if (callBack) {
                    tbody.onclick = function(event)
                    {
                        var e, src;
                        e = event,
                        src = e.target || e.srcElement;   //элемент который вызвал действие
                        if (typeof (callBack) === "function")
                        {
                            var value = (src.parentNode.rowIndex)-1;
                            callBack(json[value]);              //callback функции передаётся сам элемент на котором был клик
                         }
                    };
                }
                table.appendChild(tbody);
                table.className = 'dataGridview';

                wrapper.innerHTML = '';
                wrapper.appendChild(table);
                for (var i in textArea)
                {
                    $('#' + textArea[i]).keyup(function(event) {
                        var table = wrapper.childNodes[0];
                        if (event.keyCode === 27 || $(this).val() === '')
                        {

                            $(this).val('');
                            DGV2.unFilter(table);
                        }
                        else
                        {
                            DGV2.filter(this, table, (this.parentNode.cellIndex));
                        }

                    });
                }

            },
            filter: function(phrase, table, cell) {
                var words = phrase.value.toLowerCase().split(" ");
                var ele;
                cell = cell || 0;
                for (var r = 1; r < table.rows.length; r++) {

                    ele = table.rows[r].cells[cell].innerHTML.replace(/<[^>]+>/g, "");
                    var displayStyle = 'none';
                    for (var i = 0; i < words.length; i++) {
                        if (ele.toLowerCase().indexOf(words[i]) >= 0)
                            displayStyle = '';
                        else {
                            displayStyle = 'none';
                            break;
                        }
                    }
                    table.rows[r].style.display = displayStyle;
                }
            },
            unFilter: function(table)
            {
                for (var r = 1; r < table.rows.length; r++)
                {
                    table.rows[r].style.display = '';
                }
            },
            showHideChildNodes: function(elem)
            {
                var parentNode = elem.parentNode,
                        childs = parentNode.childNodes;
                if (childs[1].style.display === 'none')
                {
                    childs[1].style.display = '';
                    childs[1].style.type = 'text';
                    childs[0].style.display = 'none';
                }
                else if (childs[0].style.display === 'none')
                {
                    childs[0].style.display = '';
                    childs[1].style.display = 'none';
                }
                else
                {
                    childs[0].style.display = '';
                    childs[1].style.display = 'none';
                }
            },
            clearTHclassNames: function()
            {
                var U = document.getElementsByClassName('dataGridviewSortU');
                var D = document.getElementsByClassName('dataGridviewSortD');
                function unset(arr)
                {
                    for (var i in arr)
                    {
                        arr[i].className = '';
                    }
                }
                if (U.length > 0)
                    unset(U);
                if (D.length > 0)
                    unset(D);
            },
            table2JSON: function (id)
            {
                var TR = $$(id).getElementsByTagName('tbody')[0].getElementsByTagName('tr');
                console.log(TR);
                
            }

        };
        
