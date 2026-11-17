/* =====================================================================
   test-panel.js  –  DIE TESTOBERFLÄCHE (nur in test.html geladen)
   =====================================================================
   Fügt unten rechts ein Steuer-Panel ein, mit dem du:
     • die Zeit vor- und zurückspulen kannst (ohne bis zum 18.11. zu warten)
     • die letzten 15 Sekunden + Finale live testen kannst
     • direkt zur Geburtstagsseite springen kannst
     • ein beliebiges Datum/Uhrzeit simulieren kannst
     • Konfetti testen kannst
     • automatisch prüfst, ob alle Fotos/Videos, die PDF und alle Songs der Playlist
       gefunden werden und ob die config.js sinnvoll ausgefüllt ist

   Taste  T  blendet das Panel ein/aus.

   Der simulierte Zeitpunkt wird im Browser gespeichert (localStorage),
   damit er nach dem Neuladen erhalten bleibt. „Zurücksetzen“ löscht ihn.
   ===================================================================== */

(function () {
  'use strict';

  var App = window.GeburtstagApp;
  if (!App) {
    console.error('Testmodus: GeburtstagApp nicht gefunden. Ist window.TEST_MODE = true gesetzt?');
    return;
  }
  var CFG = App.config;
  var SPEICHER_SCHLUESSEL = 'geburtstag-test-versatz';

  // ---- Hilfsfunktionen -------------------------------------------------
  function speichere(wert) {
    try {
      if (wert === null) { localStorage.removeItem(SPEICHER_SCHLUESSEL); }
      else { localStorage.setItem(SPEICHER_SCHLUESSEL, String(wert)); }
    } catch (e) { /* z. B. privater Modus – egal */ }
  }
  function lade() {
    try { return localStorage.getItem(SPEICHER_SCHLUESSEL); } catch (e) { return null; }
  }

  function formatiere(ms) {
    return new Date(ms).toLocaleString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  function restText(ms) {
    if (ms <= 0) { return 'abgelaufen (seit ' + dauer(-ms) + ')'; }
    return 'noch ' + dauer(ms);
  }
  function dauer(ms) {
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600);  s -= h * 3600;
    var m = Math.floor(s / 60);    s -= m * 60;
    return (d ? d + ' T ' : '') + h + ' h ' + m + ' min ' + s + ' s';
  }

  /** Simulierte Zeit setzen und merken */
  function setzeZeit(zeitstempel) {
    App.setzeZeit(zeitstempel);
    speichere(App.versatz());
    aktualisiereAnzeige();
  }

  // ---- Panel-HTML aufbauen ---------------------------------------------
  var panel = document.createElement('aside');
  panel.className = 'testpanel';
  panel.setAttribute('aria-label', 'Testoberfläche');
  panel.innerHTML =
    '<div class="testpanel__kopf">' +
    '  <strong>🧪 Testoberfläche</strong>' +
    '  <button type="button" class="testpanel__min" data-aktion="minimieren" title="Ein-/Ausklappen (Taste T)">–</button>' +
    '</div>' +
    '<div class="testpanel__koerper">' +

    '  <section>' +
    '    <h4>Status</h4>' +
    '    <dl class="testpanel__status">' +
    '      <dt>Echte Zeit</dt><dd id="tp-echt"></dd>' +
    '      <dt>Simuliert</dt><dd id="tp-sim"></dd>' +
    '      <dt>Ziel</dt><dd id="tp-ziel"></dd>' +
    '      <dt>Rest</dt><dd id="tp-rest"></dd>' +
    '      <dt>Ansicht</dt><dd id="tp-zustand"></dd>' +
    '    </dl>' +
    '  </section>' +

    '  <section>' +
    '    <h4>Zeit steuern</h4>' +
    '    <div class="testpanel__knoepfe">' +
    '      <button type="button" data-aktion="echt">⏱ Echte Zeit</button>' +
    '      <button type="button" data-aktion="minus1h">⏩ 1 h vor Ziel</button>' +
    '      <button type="button" data-aktion="minus65s">⏩ 65 s vor Ziel</button>' +
    '      <button type="button" data-aktion="minus15s">🔥 15 s vor Ziel</button>' +
    '      <button type="button" data-aktion="danach">🎉 Nach dem Ziel</button>' +
    '      <button type="button" data-aktion="feier">🎂 Direkt zur Feier</button>' +
    '    </div>' +
    '    <label class="testpanel__datum">Eigener Zeitpunkt:' +
    '      <input type="datetime-local" step="1" id="tp-datum">' +
    '    </label>' +
    '    <button type="button" data-aktion="datum" class="testpanel__breit">📅 Zeitpunkt übernehmen</button>' +
    '  </section>' +

    '  <section>' +
    '    <h4>Effekte</h4>' +
    '    <div class="testpanel__knoepfe">' +
    '      <button type="button" data-aktion="explosion">💥 Explosion</button>' +
    '      <button type="button" data-aktion="regen">🌧 Konfetti-Regen</button>' +
    '      <button type="button" data-aktion="pdf">📄 PDF öffnen</button>' +
    '      <button type="button" data-aktion="reset">♻️ Zurücksetzen</button>' +
    '    </div>' +
    '  </section>' +

    '  <section>' +
    '    <h4>Prüfung der Dateien &amp; Einstellungen</h4>' +
    '    <ul class="testpanel__checks" id="tp-checks"><li>Prüfe …</li></ul>' +
    '    <button type="button" data-aktion="pruefen" class="testpanel__breit">🔍 Erneut prüfen</button>' +
    '  </section>' +

    '  <p class="testpanel__fuss">Taste <kbd>T</kbd> = Panel ein/aus</p>' +
    '</div>';
  document.body.appendChild(panel);

  // Auf dem Handy startet das Panel eingeklappt, damit man die Seite sieht
  if (window.innerWidth < 600) { panel.classList.add('testpanel--zu'); }

  function $(id) { return document.getElementById(id); }

  // ---- Anzeige aktualisieren -------------------------------------------
  var zustandNamen = { countdown: 'Countdown', tor: 'Tor („Überraschung öffnen“)', feier: 'Geburtstagsseite' };

  function aktualisiereAnzeige() {
    var jetzt = App.jetzt();
    $('tp-echt').textContent = formatiere(Date.now());
    $('tp-sim').textContent = App.versatz() === 0 ? '– (echte Zeit)' : formatiere(jetzt);
    $('tp-ziel').textContent = formatiere(App.ziel);
    $('tp-rest').textContent = restText(App.ziel - jetzt);
    $('tp-zustand').textContent = zustandNamen[App.zustand()] || App.zustand();
    panel.classList.toggle('testpanel--simuliert', App.versatz() !== 0);
  }
  setInterval(aktualisiereAnzeige, 500);

  // Datumsfeld mit dem Zieldatum vorbelegen (lokale Zeit)
  (function () {
    var d = new Date(App.ziel);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    $('tp-datum').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  })();

  // ---- Knöpfe ----------------------------------------------------------
  panel.addEventListener('click', function (e) {
    var knopf = e.target.closest('[data-aktion]');
    if (!knopf) { return; }
    var aktion = knopf.getAttribute('data-aktion');

    switch (aktion) {
      case 'minimieren':
        panel.classList.toggle('testpanel--zu');
        break;
      case 'echt':
        App.echteZeit(); speichere(null); aktualisiereAnzeige();
        break;
      case 'minus1h':
        setzeZeit(App.ziel - 60 * 60 * 1000);
        break;
      case 'minus65s':
        setzeZeit(App.ziel - 65 * 1000);
        break;
      case 'minus15s':
        setzeZeit(App.ziel - 15 * 1000);
        break;
      case 'danach':
        setzeZeit(App.ziel + 60 * 60 * 1000);
        break;
      case 'feier':
        App.oeffneFeier(); speichere(App.versatz()); aktualisiereAnzeige();
        break;
      case 'datum':
        var wert = $('tp-datum').value;
        if (!wert) { alert('Bitte erst ein Datum wählen.'); break; }
        setzeZeit(new Date(wert).getTime());
        break;
      case 'explosion':
        window.Konfetti && window.Konfetti.explosion();
        break;
      case 'regen':
        window.Konfetti && window.Konfetti.regen(4000);
        break;
      case 'pdf':
        window.open((CFG.geschenk && CFG.geschenk.pdf) || 'geschenk/anleitung.pdf', '_blank', 'noopener');
        break;
      case 'reset':
        speichere(null);
        location.reload();
        break;
      case 'pruefen':
        pruefeAlles();
        break;
    }
  });

  // Taste T = Panel ein-/ausklappen (nicht, wenn man gerade in ein Feld tippt)
  document.addEventListener('keydown', function (e) {
    if ((e.key === 't' || e.key === 'T') && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      panel.classList.toggle('testpanel--zu');
    }
  });

  // ---- Prüfungen -------------------------------------------------------
  function eintrag(liste, status, text) {
    var li = document.createElement('li');
    li.className = 'tp-' + status;          // ok | warn | fehler
    li.textContent = (status === 'ok' ? '✅ ' : status === 'warn' ? '⚠️ ' : '❌ ') + text;
    liste.appendChild(li);
  }

  /** Prüft per <img>, ob ein Bild geladen werden kann */
  function pruefeBild(pfad) {
    return new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { ok({ pfad: pfad, ok: true, breite: img.naturalWidth, hoehe: img.naturalHeight }); };
      img.onerror = function () { ok({ pfad: pfad, ok: false }); };
      img.src = pfad + (pfad.indexOf('?') < 0 ? '?t=' : '&t=') + Date.now();
    });
  }

  /** Prüft per <video>, ob ein Video gefunden wird UND im Browser abspielbar ist */
  function pruefeVideo(pfad) {
    return new Promise(function (ok) {
      var v = document.createElement('video');
      var fertig = false;
      function ende(erg) { if (!fertig) { fertig = true; v.removeAttribute('src'); v.load(); ok(erg); } }
      v.preload = 'metadata';
      v.muted = true;
      v.onloadedmetadata = function () {
        ende({ pfad: pfad, ok: true, breite: v.videoWidth, hoehe: v.videoHeight, dauer: v.duration });
      };
      v.onerror = function () { ende({ pfad: pfad, ok: false }); };
      setTimeout(function () { ende({ pfad: pfad, ok: false, zeitueberschreitung: true }); }, 15000);
      v.src = pfad;
    });
  }

  /** Prüft per <audio>, ob ein Song gefunden wird UND abspielbar ist */
  function pruefeAudio(pfad) {
    return new Promise(function (ok) {
      var a = new Audio();
      var fertig = false;
      function ende(erg) { if (!fertig) { fertig = true; a.removeAttribute('src'); a.load(); ok(erg); } }
      a.preload = 'metadata';
      a.onloadedmetadata = function () { ende({ pfad: pfad, ok: true, dauer: a.duration }); };
      a.onerror = function () { ende({ pfad: pfad, ok: false }); };
      setTimeout(function () { ende({ pfad: pfad, ok: false }); }, 15000);
      a.src = pfad;
    });
  }

  function zeitText(sek) {
    if (!isFinite(sek)) { return '?'; }
    var m = Math.floor(sek / 60), s2 = Math.floor(sek % 60);
    return m + ':' + (s2 < 10 ? '0' : '') + s2 + ' min';
  }

  function istVideo(f) {
    return f.typ === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(f.datei || '');
  }

  /** Prüft per fetch, ob eine Datei existiert (geht nur über http/https, nicht über file://) */
  function pruefeDatei(pfad) {
    if (location.protocol === 'file:') { return Promise.resolve({ pfad: pfad, ok: null }); }
    return fetch(pfad, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) { return { pfad: pfad, ok: r.ok, groesse: r.headers.get('content-length') }; })
      .catch(function () { return { pfad: pfad, ok: false }; });
  }

  function pruefeAlles() {
    var liste = $('tp-checks');
    liste.innerHTML = '';
    var aufgaben = [];

    // Config-Prüfungen
    if (!CFG.name) { eintrag(liste, 'fehler', 'Kein Name eingetragen (config.js → name).'); }
    else if (CFG.name === 'Max') { eintrag(liste, 'warn', 'Name ist noch der Beispielwert „Max“.'); }
    else { eintrag(liste, 'ok', 'Name: ' + CFG.name); }

    if (CFG.von === 'Dein bester Freund') { eintrag(liste, 'warn', '„von“ ist noch der Beispielwert – trag deinen Namen ein.'); }

    if (isNaN(App.ziel)) { eintrag(liste, 'fehler', 'zielDatum ist ungültig.'); }
    else { eintrag(liste, 'ok', 'Zieldatum: ' + formatiere(App.ziel)); }

    if (CFG.alter === null || CFG.alter === undefined) {
      eintrag(liste, 'warn', 'Kein Alter gesetzt – Alter-Steine werden ausgeblendet. Achtung: {alter} im Brief bleibt dann leer.');
    }

    // Statistik: Platzhalter-Texte „ERSETZEN“ noch nicht ersetzt?
    var statEintraege = (CFG.statistik && CFG.statistik.eintraege) || [];
    var statPlatzhalter = statEintraege.filter(function (e) {
      return /ERSETZEN/.test(String(e.zahl || '') + String(e.text || '') + String(e.titel || ''));
    }).length;
    if (statPlatzhalter) {
      eintrag(liste, 'warn', 'Statistik: ' + statPlatzhalter + ' Kachel(n) enthalten noch „ERSETZEN“ – Texte ersetzen oder Einträge löschen.');
    } else if (statEintraege.length) {
      eintrag(liste, 'ok', 'Statistik: ' + statEintraege.length + ' Kacheln eingetragen.');
    }

    // Fotos
    var fotos = (CFG.collage && CFG.collage.fotos) || [];
    if (!fotos.length) { eintrag(liste, 'warn', 'Keine Fotos in der Collage eingetragen.'); }
    fotos.forEach(function (f) {
      if (istVideo(f)) {
        aufgaben.push(pruefeVideo(f.datei).then(function (r) {
          if (!r.ok) {
            eintrag(liste, 'fehler', 'Video fehlt oder ist nicht abspielbar: ' + r.pfad +
              (/\.mov$/i.test(r.pfad) ? ' (.mov vom iPhone → am besten in MP4 umwandeln)' : ' (Dateiname prüfen; Format am besten MP4/H.264)'));
            return;
          }
          return pruefeDatei(r.pfad).then(function (d) {
            var mb = d.groesse ? Number(d.groesse) / 1048576 : null;
            if (mb !== null && mb > 25) {
              eintrag(liste, 'fehler', 'Video zu groß (' + mb.toFixed(1) + ' MB): ' + r.pfad + ' – GitHub-Upload im Browser & Cloudflare erlauben max. 25 MB pro Datei.');
            } else if (mb !== null && mb > 10) {
              eintrag(liste, 'warn', 'Video recht groß (' + mb.toFixed(1) + ' MB): ' + r.pfad + ' – lädt auf dem Handy langsam; Netlify empfiehlt < 10 MB pro Datei.');
            } else {
              eintrag(liste, 'ok', 'Video ok (' + Math.round(r.dauer) + ' s' + (mb !== null ? ', ' + mb.toFixed(1) + ' MB' : '') + '): ' + r.pfad);
            }
          });
        }));
        if (f.vorschau) {
          aufgaben.push(pruefeBild(f.vorschau).then(function (r) {
            if (!r.ok) { eintrag(liste, 'fehler', 'Vorschaubild fehlt: ' + r.pfad); }
          }));
        }
        return;
      }
      aufgaben.push(pruefeBild(f.datei).then(function (r) {
        if (!r.ok) { eintrag(liste, 'fehler', 'Foto fehlt: ' + r.pfad + ' (Dateiname & Groß-/Kleinschreibung prüfen!)'); }
        else if (r.breite === 1200 && r.hoehe === 899 && /foto\d\.jpg$/.test(r.pfad)) {
          eintrag(liste, 'warn', 'Platzhalter-Bild: ' + r.pfad + ' – durch echtes Foto ersetzen.');
        }
        else if (r.breite > 3000 || r.hoehe > 3000) {
          eintrag(liste, 'warn', 'Sehr groß (' + r.breite + '×' + r.hoehe + '): ' + r.pfad + ' – verkleinern lädt schneller.');
        }
        else { eintrag(liste, 'ok', 'Foto ok: ' + r.pfad); }
      }));
    });

    // PDF
    var pdf = (CFG.geschenk && CFG.geschenk.pdf) || 'geschenk/anleitung.pdf';
    aufgaben.push(pruefeDatei(pdf).then(function (r) {
      if (r.ok === null) { eintrag(liste, 'warn', 'PDF kann über file:// nicht geprüft werden – nutze „📄 PDF öffnen“.'); }
      else if (!r.ok) { eintrag(liste, 'fehler', 'PDF nicht gefunden: ' + pdf); }
      else if (r.groesse && Number(r.groesse) < 100000) { eintrag(liste, 'warn', 'PDF gefunden, aber sehr klein – ist es noch der Platzhalter? (' + pdf + ')'); }
      else { eintrag(liste, 'ok', 'PDF gefunden: ' + pdf); }
    }));

    // Musik-Playlist: jeder Song wird mit einem <audio>-Element geprüft
    // (funktioniert auch über file://)
    var songs = window.Playlist ? window.Playlist.songs() : [];
    if (!songs.length) {
      eintrag(liste, 'ok', 'Keine Songs in der Playlist (optional).');
    } else {
      songs.forEach(function (song) {
        aufgaben.push(pruefeAudio(song.datei).then(function (r) {
          var name = '„' + song.titel + '“ (' + song.datei + ')';
          if (!r.ok) {
            eintrag(liste, 'fehler', 'Song fehlt oder ist nicht abspielbar: ' + name);
          } else if (/^Lieblingssong Nr\. \d$/.test(song.titel) || song.kuenstler === 'Interpret') {
            eintrag(liste, 'warn', 'Song gefunden (' + zeitText(r.dauer) + '), aber Titel/Interpret sind noch Beispieltexte: ' + song.datei);
          } else {
            eintrag(liste, 'ok', 'Song ok (' + zeitText(r.dauer) + '): ' + name);
          }
        }));
      });
    }

    Promise.all(aufgaben).then(function () {
      var fehler = liste.querySelectorAll('.tp-fehler').length;
      var warn = liste.querySelectorAll('.tp-warn').length;
      var zusammenfassung = document.createElement('li');
      zusammenfassung.className = 'tp-summe';
      zusammenfassung.textContent = fehler ? fehler + ' Fehler, ' + warn + ' Hinweise'
        : warn ? 'Keine Fehler, ' + warn + ' Hinweise'
        : 'Alles bereit! 🎉';
      liste.insertBefore(zusammenfassung, liste.firstChild);
    });
  }

  // ---- Start -----------------------------------------------------------
  // Gespeicherten Testzeitpunkt wiederherstellen
  var gespeichert = lade();
  if (gespeichert !== null && !isNaN(Number(gespeichert)) && Number(gespeichert) !== 0) {
    App.setzeZeit(Date.now() + Number(gespeichert));
  }
  aktualisiereAnzeige();
  pruefeAlles();
})();
