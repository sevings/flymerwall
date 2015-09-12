/*
  Copyright (C) 2015 Vasily Khodakov
  Contact: Vasily Khodakov <binque@ya.ru>
  All rights reserved.

  This file is part of Flymer Wall.

  Flymer Wall is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Flymer Wall is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Flymer Wall.  If not, see <http://www.gnu.org/licenses/>.
*/

import QtQuick 2.2
import QtQuick.Controls 1.1
import QtWebKit 3.0
import QtQuick.Layouts 1.1
import QtQuick.Dialogs 1.2
import htmlcreator 1.0

import "./auth.js" as AuthJS
import "./storage.js" as StorageJS
import "./wallAPI.js" as WallAPI

ApplicationWindow {
    visible: true
    width: 800
    height: 600
    title: qsTr("Flymer Wall")
    property string authUrl: "https://oauth.vk.com/authorize" +
                             "?client_id=4853568" +
                             "&redirect_uri=https://oauth.vk.com/blank.html" +
                             "&scope=wall" +
                             "&display=mobile" +
                             "&response_type=token"
    property string html
    HTMLCreator {
        id: creator
    }

    menuBar: MenuBar {
        id: menu
        Menu {
            title: 'Файл'
            enabled: !busy.running
            MenuItem {
                id: showHtml
                text: 'Сохранить HTML как…'
                shortcut: 'Ctrl+S'
                enabled: false
                onTriggered: fileDialog.visible = true;
            }
            MenuSeparator { }
            MenuItem {
                text: 'Выход'
                shortcut: 'Ctrl+Q'
                onTriggered: Qt.quit()
            }
        }

        Menu {
            title: 'Стена'
            enabled: !busy.running
            MenuItem {
                text: 'Первые посты'
                onTriggered: {
                    busy.running = true;
                    posts(StorageJS.getFirstPosts())
                }
            }
            MenuItem {
                text: 'Последние посты'
                onTriggered: {
                    busy.running = true;
                    posts(StorageJS.getLastPosts())
                }
            }
            MenuItem {
                text: 'Лучшие за неделю'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getWeeklyTopPosts())
                }
            }
            MenuItem {
                text: 'Лучшие за все время'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getTopPosts())
                }
            }
            MenuItem {
                text: 'Рисунки'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getDrawings())
                }
            }
            MenuItem {
                text: 'Голоса'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getVoices())
                }
            }
            MenuItem {
                text: 'Вайлент-таймы'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getVTs())
                }
            }
            MenuItem {
                text: 'Список фей'
                onTriggered:  {
                    busy.running = true;
                    fairies()
                }
            }
            MenuItem {
                text: 'Поиск'
                //checkable: true
                onTriggered: {
                    //var show = !searchPanel.visible;
                    searchPanel.visible = true;
                    searchText.focus = true;
                    //checked = show;
                    searchPanel.page = 'flymerwall'
                }
            }
            MenuSeparator { }
            MenuItem {
                text: 'Обновить базу данных'
                onTriggered: updateDB('flymerwall');
            }
        }
        Menu {
            title: 'Ищу тебя'
            enabled: !busy.running
            MenuItem {
                text: 'Первые посты'
                onTriggered: {
                    busy.running = true;
                    posts(StorageJS.getFirstPosts('lookingforyou'))
                }
            }
            MenuItem {
                text: 'Последние посты'
                onTriggered: {
                    busy.running = true;
                    posts(StorageJS.getLastPosts('lookingforyou'))
                }
            }
            MenuItem {
                text: 'Лучшие за неделю'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getWeeklyTopPosts('lookingforyou'))
                }
            }
            MenuItem {
                text: 'Лучшие за все время'
                onTriggered:  {
                    busy.running = true;
                    posts(StorageJS.getTopPosts('lookingforyou'))
                }
            }
            MenuItem {
                text: 'Список фей'
                onTriggered:  {
                    busy.running = true;
                    fairies('lookingforyou')
                }
            }
            MenuItem {
                text: 'Поиск'
                //checkable: true
                onTriggered: {
                    //var show = !searchPanel.visible;
                    searchPanel.visible = true;
                    searchText.focus = true;
                    //checked = show;
                    searchPanel.page = 'lookingforyou';
                }
            }
            MenuSeparator { }
            MenuItem {
                text: 'Обновить базу данных'
                onTriggered: updateDB('lookingforyou');
            }
        }
    }
    ScrollView {
        id: scroll
        anchors.fill: parent
        WebView {
            id: webview
            anchors.fill: parent
            onUrlChanged:  {
                checkUrl(url);
                //console.log(url);
                if (busy.running || /^file/.exec(url.toString()) !== null)
                    goBack.visible = false;
                else
                    goBack.visible = true;
            }
            onNavigationRequested: {
                var url = request.url.toString();
                //console.log(url);
                var regexp = /likePost(\d+)ofUser(\d+)$/g;
                var ids = regexp.exec(url);
                if (ids !== null) {
                    request.action = WebView.IgnoreRequest;
                    WallAPI.likePost(ids[2], ids[1]);
                }
                else {
                    request.action = WebView.AcceptRequest;
                }
            }
        }
    }
    Button {
        id: goBack
        text: 'Назад'
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: 10
        //visible: webview.canGoBack && /^file:\/\//g.exec(webview.url.toString()) === null && !busy.running
        visible: false
        onClicked: webview.goBack()
    }

    Rectangle {
        id: searchPanel
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        visible: false
        height: 40 + searchButton.height + searchText.height + nameText.height
        property string page
        Text {
            id: textLabel
            text: 'Текст'
            anchors.left: parent.left
            anchors.verticalCenter: searchText.verticalCenter
            anchors.margins: 10
        }
        TextField {
            id: searchText
            anchors.left: textLabel.right
            anchors.right: parent.right
            anchors.top: parent.top
            font.pointSize: 18
            anchors.margins: 10
            onAccepted: searchPosts()
        }
        Text {
            id: nameLabel
            text: 'Имя'
            anchors.verticalCenter: nameText.verticalCenter
            anchors.horizontalCenter: textLabel.horizontalCenter
            anchors.margins: 10
        }
        TextField {
            id: nameText
            anchors.left: textLabel.right
            anchors.right: parent.right
            anchors.top: searchText.bottom
            font.pointSize: searchText.font.pointSize
            anchors.margins: 10
            onAccepted: searchPosts()
        }

        Text {
            id: pageLabel
            text: parent.page === 'lookingforyou' ? '«Ищу тебя»' : 'Стена'
            anchors.left: parent.left
            anchors.verticalCenter: searchButton.verticalCenter
            anchors.margins: 10
        }

        Button {
            id: searchButton
            text: 'Искать посты'
            anchors.right: closeButton.left
            anchors.bottom: parent.bottom
            anchors.margins: 10
            onClicked: searchPosts();
        }
        Button {
            id: closeButton
            text: 'Закрыть'
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            anchors.margins: 10
            onClicked: searchPanel.visible = false
        }
    }
    BusyIndicator {
        id: busy
        anchors.centerIn: parent
        running: false
    }
    FileDialog {
        id: fileDialog
        selectExisting: false
        title: 'Сохранить HTML как…'
        nameFilters: ['HTML files (*.html)', 'All files (*)']
        onAccepted: {
            console.log('You chose: ' + fileUrl);
            var toSave = html.replace(/<a href="likePost\d+ofUser\d+">(\d+) &#10084;<\/a>/g, '$1 &#10084;');
            toSave = toSave.replace(/<a href=/g, '<a target=_blank href=')
            creator.saveToFile(fileUrl, toSave);
        }
    }

    Component.onCompleted: {
        StorageJS.initDatabase();
        //StorageJS.getWeeklyCounts('flymerwall')
        //webview.url = authUrl;
    }
    function checkUrl(url) {
        if (AuthJS.checkUrl(url) !== 1) {
            console.log('token: ' + AuthJS.accessToken);
            StorageJS.storeSettingsValue("access_token", AuthJS.accessToken);
            StorageJS.storeSettingsValue("user_id", AuthJS.userId);
            updateDB();
        }
    }
    function searchPosts() {
        busy.running = true;
        posts(StorageJS.searchPosts(searchPanel.page, searchText.text, nameText.text));
    }

    function fairies(page) {
        var f = StorageJS.getFairies(page);
        html = '<html><meta charset="UTF-8"><head><title>Список фей</title></head>\n';
        html += '<style type="text/css"><!--\n';
        html += '.avatar { padding: 10px; width: 100px; height: 100px; }\n';
        html += '.user_block { margin: 0 auto; border-top: 1px solid #ededed; padding: 10px 0px; '
                + 'clear: both; font-size: large; max-width: 600px; }\n';
        html += '--!></style><body>\n';
        var published;
        for (var k = 0; k < f.length; k++) {
            if (f[k].count % 10 === 1 && f[k].count % 100 !== 11)
                published = f[k].count + ' публикация';
            else if (f[k].count % 10 > 1 && f[k].count % 10 < 5 && (f[k].count % 100 < 11 || f[k].count % 100 > 14))
                published = f[k].count + ' публикации';
            else
                published = f[k].count + ' публикаций';
            html += ('<div class="user_block">\n'
                     + '<img align=left class="avatar" src='
                     + f[k].avatar + '>'
                     + '<br>\n' + (k+1) + '. <a target=_blank href="https://vk.com/'+ f[k].domain + '">'
                     + f[k].name
                     + '</a><br><br>\nФея с ' + f[k].from + '!'
                     + '<br>' + published
                     + '<br></div><br>\n ');
        }
        html += '</body></html>';
        loadHtml();
    }

    property string updateDBPage: 'flymerwall'
    function updateDB(page) {
        if (page === undefined)
            page = updateDBPage;
        if (!StorageJS.readSettingsValue("user_id")) {
            showHtml.enabled = false;
            updateDBPage = page;
            webview.url = authUrl;
            return;
        }

        busy.running = true;
        webview.loadHtml('<h1 align="center">Идет обновление базы данных…<br>'
                         + 'Это может занять несколько минут, <br>в течение которых <br>'
                         + 'индикатор не обязательно будет вращаться</h1>');
        WallAPI.getAllPosts(page, function() {
            busy.running = false;
            if (WallAPI.countToLoad === 0) {
                showHtml.enabled = false;
                webview.url = authUrl;
                return;
            }
            console.log('done');
            webview.loadHtml('<h1 align="center">База данных обновлена</h1>');
        });
    }

    function posts(wall) {
        html = '<html><meta charset="UTF-8"><head><title>Flymer</title></head>\n';
        html += '<style type="text/css"><!--\n';
        html += '.fig {text-align: center; }\n'
        //html += '.picture { padding: 10px 0px; }\n';
        html += '.likes {font-size: smaller; padding: 0px 10px}\n'
        html += '.post { margin: 0 auto; border-top: 1px solid #ededed; padding: 10px 0px; '
                + 'clear: both; font-size: large; max-width: 800px; }\n';
        html += '--!></style><body>\n';
        var k, photo, audio, video, link, doc;
        for (var i = 0; i < wall.length; i++) {
            html += ('<div class=post>' //+ (wall.length-i)
                     + '<a href="https://vk.com/'+ wall[i].domain + '">'
                     + wall[i].name + '</a>'
                     + (wall[i].text === null ? '' : ': ' + wall[i].text.replace(/\n/g, '<br>\n')));
            if (wall[i].hasOwnProperty('audio'))
                for (k = 0; k < wall[i].audio.length; k++) {
                    if (wall[i].audio[k].url !== null)
                        audio = '<p class=fig><a href=' + wall[i].audio[k].url + '>' + wall[i].audio[k].title + '</a></p>\n';
                    else audio = '<p class=fig>' + wall[i].audio[k].title + '</p>\n';
                    html += audio;
                }
            if (wall[i].hasOwnProperty('video'))
                for (k = 0; k < wall[i].video.length; k++) {
                    video = '<p class=fig><a href='
                            + wall[i].video[k].url
                            + '><img src=' + wall[i].video[k].preview
                            + '><br><br>' + (wall[i].video[k].title === null ? '' : wall[i].video[k].title) + '</a></p>\n';
                    html += video;
                }
            if (wall[i].hasOwnProperty('photo'))
                for (k = 0; k < wall[i].photo.length; k++) {
                    photo = wall[i].photo[k].preview;
                    if (wall[i].photo[k].original !== null)
                        photo = '<p class=fig><a href="' + wall[i].photo[k].original
                                + '"><img src="' + photo +  '"></a></p>\n';
                    else
                        photo = '<p class=fig><img src="' + photo + '"></p>\n'

                    html += photo;
                }
            if (wall[i].hasOwnProperty('links'))
                for (k = 0; k < wall[i].links.length; k++) {
                    link = '<br><a href=' + wall[i].links[k].url + '>' + (wall[i].links[k].title === null ? '' : wall[i].links[k].title)
                            + '</a>\n'
                    html += link;
                }
            if (wall[i].hasOwnProperty('docs'))
                for (k = 0; k < wall[i].docs.length; k++) {
                    doc = '<br><a href=' + wall[i].docs[k].url + '>';
                    if (wall[i].docs[k].preview !== null)
                        doc += '<img src=' + wall[i].docs[k].preview + '><br>';
                    doc += wall[i].docs[k].title + '</a>\n';
                    html += doc;
                }

            html += '<div class=likes align=right>' + (new Date(wall[i].date * 1000)).toLocaleString() + ' | '
                    + wall[i].comments + ' &#9993; | '
                    + '<a href="likePost' + wall[i].id + 'ofUser' + wall[i].user + '">'
                    + wall[i].likes + ' &#10084;</a></div></div>\n';
        }
        html += '</body></html>';
        loadHtml();
    }

    function loadHtml() {
        var url = creator.tempFile(html);
        //console.log(url);
        webview.url = url;
        showHtml.enabled = true;
        goBack.visible = false;
        busy.running = false;
    }
}
