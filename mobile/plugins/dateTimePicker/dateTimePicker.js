//********************Date time picker*********************************
/**
 * @author OverKinG aka Oleg Bondatenko
 * @param {type} id
 * @returns {undefined}
 */
var onChange = function(id, time, set) {
}; //Обработчик для сравнения
var now = new Date();
/**
 *
 * @class - класс формирования всплывающего окна установки даты
 * @param {initWorkPlace} - начальная инициализация
 * @param {popup} вызов всплывающего окнаmaxLength:
 * @param {set} установка выбранной даты
 * @param {abort} отмена установка выбранной даты
 *
 */
var dateTimePicker =
        {
            now:
                    {
                        year: now.getFullYear(),
                        day: now.getDate(),
                        month: now.getMonth() + 1,
                        month_normal: function()
                        {
                            var month = now.getMonth() + 1;
                            if (month < 10)
                                return ('0' + month);
                            else
                                return month;
                        },
                        day_normal: function()
                        {
                            var day = now.getDate();
                            if (day < 10)
                                return ('0' + day);
                            else
                                return day;
                        }
                    },
            min:
                    {
                        year: now.getFullYear() - 5//наименшая дата
                    },
            max:
                    {
                        year: now.getFullYear() + 5//наибольшая дата
                    },
            NewDate: new Date(),
            where: false,
            initWorkPlace: function() {



                Date.prototype.daysInMonth = function() { //добавлен прототип количиство дней в месяце
                    return 32 - new Date(this.getFullYear(), this.getMonth(), 32).getDate();
                };
                Date.prototype.normalday = function() { //добавлен прототип день с ноль или нет
                    var day = this.getDate();
                    if (day < 10)
                        return ('0' + day);
                    else
                        return day;
                };
                Date.prototype.normalmonth = function() { //добавлен прототип месяц с ноль или нет
                    var month = this.getMonth();
                    if (month < 9)
                        return ('0' + (month + 1));
                    else
                        return month + 1;
                };
                var is_touch_device = 'ontouchstart' in document.documentElement, clickEvent;
                if (is_touch_device)
                {
                    clickEvent = 'ontouchend';
                }
                else
                {
                    clickEvent = 'onclick';
                }

                var divs = '\
<div id="dtp_popup" style="display: none;">\n\
<div id="dtp_header">\n\
</div>\n\
<div id="content_dtp">\n\
<div id="dtp_plus_day" class="dtp_plus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_day\',\'plus\');">+\n\
</div>\n\
<div id="dtp_day" class="dtp_value">\n\
</div>\n\
<div id="dtp_minus_day" class="dtp_minus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_day\',\'minus\');">-\n\
</div>\n\
<div id="dtp_plus_month" class="dtp_plus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_month\',\'plus\');">+\n\
</div>\n\
<div id="dtp_month" class="dtp_value">\n\
</div>\n\
<div id="dtp_minus_month" class="dtp_minus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_month\',\'minus\');">-\n\
</div>\n\
<div id="dtp_plus_year" class="dtp_plus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_year\',\'plus\');">+\n\
</div>\n\
<div id="dtp_year" class="dtp_value">\n\
</div><div id="dtp_minus_year" class="dtp_minus" ' + clickEvent + '="dateTimePicker.sign(\'dtp_year\',\'minus\');">-\n\
</div>\n\
</div>\n\
<div id="dtp_bottom">\n\
<button id="dtp_setup" ' + clickEvent + '="dateTimePicker.set(alert);" class="dtp_button">Установить</button>\n\
<button id="dtp_cancel" ' + clickEvent + '="dateTimePicker.abort();" class="dtp_button">Отмена</button>\n\
</div>\n\
</div>';



                $('body').append(divs);
                var nodes = ["dtp_plus_day", "dtp_minus_day", "dtp_plus_month", "dtp_minus_month", "dtp_plus_year", "dtp_minus_year"];
//заполним значениями popup окно

            },
            click_sign: function(id, val) {
                var touchdev = ('ontouchstart' in document.documentElement); //Сенсорный или нет вот в чём вопрос
                if (!touchdev)
                    dateTimePicker.sign(id, val);
            },
            popup: function(div_id) // Функция вфзова DTP, получает в качестве аргумента this.id поля ввода
            {
                document.getElementById('dtp_day').innerHTML = dateTimePicker.now.day_normal();
                document.getElementById('dtp_month').innerHTML = dateTimePicker.now.month_normal();
                document.getElementById('dtp_year').innerHTML = dateTimePicker.now.year;

                var element = document.getElementById(div_id);
                element.disabled = true;//блокируем
                dateTimePicker.where = document.getElementById(div_id);
                var popup = document.getElementById('dtp_popup');
                popup.style.display = 'block';
                document.getElementById('dtp_header').innerHTML = 'Сегодня ' + dateTimePicker.now.day_normal() + '.' + dateTimePicker.now.month_normal() + '.' + dateTimePicker.now.year;
                if (element.value.match(/\d\d\d\d/)) //если ячейка пустая
                {
                    document.getElementById('dtp_day').innerHTML = element.value[0] + element.value[1];
                    document.getElementById('dtp_month').innerHTML = element.value[3] + element.value[4];
                    document.getElementById('dtp_year').innerHTML = element.value[6] + element.value[7] + element.value[8] + element.value[9];
                }
                else
                {
                    document.getElementById('dtp_day').innerHTML = dateTimePicker.now.day_normal();
                    document.getElementById('dtp_month').innerHTML = dateTimePicker.now.month_normal();
                    document.getElementById('dtp_year').innerHTML = dateTimePicker.now.year;
                }
                var screenWidth = document.documentElement.clientWidth;
                var screenHeight = document.documentElement.clientHeight;
                popup.style.left = (screenWidth - popup.clientWidth) / 2;
                popup.style.top = (screenHeight - popup.clientHeight) / 2;
            },
            /* set: function(callback)
             {
             var write = dateTimePicker.where;
             write.value = document.getElementById('dtp_day').innerHTML + '-' + document.getElementById('dtp_month').innerHTML + '-' + document.getElementById('dtp_year').innerHTML;
             document.getElementById('dtp_popup').style.display = 'none';
             onChange(dateTimePicker.where.id, dateTimePicker.NewDate, true);//это переменная для дальнейших манипуляция!!!!!
             write.disabled = false; //обнуляем id места куда вносим изменения
             if (callback)
             {
             callback(dateTimePicker.where.id, dateTimePicker.NewDate.getTime());
             }
             },*/
            abort: function()
            {
                document.getElementById('dtp_popup').style.display = 'none';
                onChange(dateTimePicker.where.id, dateTimePicker.NewDate, false);//это переменная для дальнейших манипуляция!!!!!
                dateTimePicker.where.disabled = false;
            },
            sign: function(id, sign)
            {
                var y = parseInt(document.getElementById('dtp_year').innerHTML);
                var m = parseInt(document.getElementById('dtp_month').innerHTML);
                var d = parseInt(document.getElementById('dtp_day').innerHTML);
                var i = document.getElementById(id);

                if (id == 'dtp_year')
                {
                    if (sign == 'plus' && y <= dateTimePicker.max.year)
                        y++;
                    if (sign == 'minus' && y >= dateTimePicker.min.year)
                        y--;
                    dateTimePicker.NewDate.setFullYear(y);
                    i.innerHTML = dateTimePicker.NewDate.getFullYear();
                }
                else if (id == 'dtp_month')
                {
                    if (sign == 'plus' && m < 12)
                        m++;
                    if (sign == 'minus' && m > 1)
                        m--;
                    dateTimePicker.NewDate.setMonth(m - 1);

                    if (document.getElementById('dtp_day').innerHTML != dateTimePicker.NewDate.normalday())
                    {
                        dateTimePicker.NewDate.setMonth(m - 1)
                        dateTimePicker.NewDate.setDate(1)
                    }
                    i.innerHTML = dateTimePicker.NewDate.normalmonth();
                    document.getElementById('dtp_day').innerHTML = dateTimePicker.NewDate.normalday();
                }
                else if (id == 'dtp_day')
                {
                    if (sign == 'plus' && d < dateTimePicker.NewDate.daysInMonth())
                        d++;
                    if (sign == 'minus' && d > 1)
                    {
                        d--;
                    }
                    dateTimePicker.NewDate.setDate(d);
                    i.innerHTML = dateTimePicker.NewDate.normalday();
                }
            },
            filldtp: function(id, callback)
            {
                var elem = document.getElementById(id);
                elem.value = dateTimePicker.now.day_normal() + '-' + dateTimePicker.now.month_normal() + '-' + dateTimePicker.now.year;
                elem.onclick = function() {
                    dateTimePicker.popup(id);
                    document.getElementById('dtp_setup').onclick = function() {

                        var write = dateTimePicker.where;
                        write.value = document.getElementById('dtp_day').innerHTML + '-' + document.getElementById('dtp_month').innerHTML + '-' + document.getElementById('dtp_year').innerHTML;
                        document.getElementById('dtp_popup').style.display = 'none';
                        onChange(dateTimePicker.where.id, dateTimePicker.NewDate, true);//это переменная для дальнейших манипуляция!!!!!
                        write.disabled = false; //обнуляем id места куда вносим изменения
                        if (callback)
                        {
                            callback(dateTimePicker.where.id, dateTimePicker.NewDate.getTime());
                        }



                    };
                };

            },
            SetIntDay: function(elementId, intDays)
            {
                var days = new Date(intDays);
                document.getElementById(elementId).value = days.format("dd-mm-yyyy");
            },
            GetIntDay: function(elementId)
            {
                var dayElementList = document.getElementById(elementId).value.split('-');
                return new Date(Date.parse(dayElementList[2] + "-" + dayElementList[1] + "-" + dayElementList[0])).getTime();
            }
        };