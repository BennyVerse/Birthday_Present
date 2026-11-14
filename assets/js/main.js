/* =====================================================================
   main.js  –  DIE LOGIK DER GEBURTSTAGS-WEBSITE
   =====================================================================
   Was passiert hier? (Übersicht)

   1. Einstellungen aus config.js lesen
   2. Alle Texte in die Seite einsetzen ({name} usw. ersetzen)
   3. Jede Viertelsekunde prüfen: Ist das Zieldatum schon erreicht?
        NEIN → Countdown-Bildschirm anzeigen und Timer aktualisieren
               (in den letzten 10 Sekunden: riesige Finale-Zahl)
        JA   → „Tor“-Bildschirm anzeigen („Überraschung öffnen“)
   4. Klick auf „Überraschung öffnen“ → Geburtstagsseite aufbauen:
        Konfetti, Alter-Steine, Collage (Fotos & Videos), Wünsche,
        Playlist (startet die Musik), Brief, Geschenk
   5. Klick auf den Geschenk-Stein → Link zur PDF erscheint

   Die drei Zustände der Seite heißen:  'countdown'  →  'tor'  →  'feier'

   Für normale Änderungen (Texte, Fotos, Datum) musst du hier NICHTS
   ändern – dafür gibt es die config.js.
   ===================================================================== */

(function () {
  'use strict';

  /* ===================================================================
     0) GRUNDLAGEN
     =================================================================== */

  var CFG = window.GEBURTSTAG_CONFIG;
  if (!CFG) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">' +
      'Fehler: assets/js/config.js konnte nicht geladen werden ' +
      '(Tippfehler in der Datei? Fehlendes Komma oder Anführungszeichen?).</p>';
    return;
  }

  // Läuft die Seite als test.html? (wird dort vor diesem Skript gesetzt)
  var TESTMODUS = window.TEST_MODE === true;

  // Kurzschreibweise, um Elemente zu finden
  function $(id) { return document.getElementById(id); }

  // Nutzer möchte wenig Animation (Systemeinstellung)?
  var wenigBewegung = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Zielzeitpunkt als Millisekunden-Zahl
  var ZIEL = new Date(CFG.zielDatum).getTime();
  var START = CFG.fortschrittStart ? new Date(CFG.fortschrittStart).getTime() : null;

  if (isNaN(ZIEL)) {
    console.error('zielDatum in config.js ist ungültig:', CFG.zielDatum);
  }


  /* ===================================================================
     1) ZEIT
     -------------------------------------------------------------------
     Alle Zeitabfragen laufen über Zeit.jetzt(). Im Testmodus kann das
     Test-Panel einen „Versatz“ (offset) setzen und so die Zeit
     vor- oder zurückspulen. In der finalen Seite ist der Versatz immer 0.
     =================================================================== */

  var Zeit = {
    versatz: 0,
    jetzt: function () { return Date.now() + this.versatz; }
  };


  /* ===================================================================
     2) TEXTE EINSETZEN
     =================================================================== */

  /** Liest einen Wert aus der Config, z. B. pfad = "brief.titel" */
  function ausConfig(pfad) {
    return pfad.split('.').reduce(function (obj, teil) {
      return (obj && obj[teil] !== undefined) ? obj[teil] : undefined;
    }, CFG);
  }

  /** Ersetzt {name}, {alter} und {von} durch die echten Werte */
  function ersetze(text) {
    if (text === undefined || text === null) { return ''; }
    return String(text)
      .replace(/\{name\}/g, CFG.name || '')
      .replace(/\{alter\}/g, (CFG.alter !== null && CFG.alter !== undefined) ? CFG.alter : '')
      .replace(/\{von\}/g, CFG.von || '');
  }

  /**
   * Setzt Text in ein Element. Der Name wird dabei in ein
   * <span class="name"> gepackt, damit er farbig hervorgehoben
   * werden kann. (Sicher: es wird nie HTML aus der Config ausgeführt.)
   */
  function setzeText(el, vorlage) {
    el.textContent = '';
    var teile = String(vorlage === undefined ? '' : vorlage).split('{name}');
    teile.forEach(function (stueck, i) {
      // Satzzeichen direkt nach dem Namen (z. B. „Max!“) gehören mit in den
      // Namens-Block, damit das „!“ nie allein in die nächste Zeile rutscht.
      if (i > 0) {
        var zeichen = stueck.match(/^[!?.,:;…]+/);
        if (zeichen) {
          el.lastChild.textContent += zeichen[0];
          stueck = stueck.slice(zeichen[0].length);
        }
      }
      el.appendChild(document.createTextNode(ersetze(stueck)));
      if (i < teile.length - 1) {
        var span = document.createElement('span');
        span.className = 'name';
        span.textContent = CFG.name || '';
        el.appendChild(span);
      }
    });
  }

  /** Alle Elemente mit data-text="..." befüllen */
  function fuelleAlleTexte() {
    var elemente = document.querySelectorAll('[data-text]');
    Array.prototype.forEach.call(elemente, function (el) {
      var wert = ausConfig(el.getAttribute('data-text'));
      if (wert === undefined || wert === '') {
        el.hidden = true;           // leere Texte einfach ausblenden
      } else {
        setzeText(el, wert);
      }
    });
  }

  /** Zieldatum schön auf Deutsch formatieren */
  function zieldatumText() {
    try {
      var datum = new Date(ZIEL);
      var tag = datum.toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Europe/Berlin'
      });
      var uhr = datum.toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
      });
      return 'bis ' + tag + ' um ' + uhr + ' Uhr';
    } catch (e) {
      return '';
    }
  }


  /* ===================================================================
     3) BILDSCHIRME UMSCHALTEN
     =================================================================== */

  var zustand = null;                 // 'countdown' | 'tor' | 'feier'
  var screens = {
    countdown: $('countdown'),
    tor: $('tor'),
    feier: $('feier')
  };

  function zeige(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].hidden = (k !== name);
    });
    zustand = name;
    document.body.setAttribute('data-zustand', name);
    document.title = ersetze(name === 'countdown' ? CFG.tabTitelVorher : CFG.tabTitelNachher);
    if (name !== 'countdown') { $('finale').hidden = true; }
    // Musik-Player gibt es nur auf der Geburtstagsseite
    if (name !== 'feier' && window.Playlist) { window.Playlist.verstecken(); }
    window.scrollTo(0, 0);
  }


  /* ===================================================================
     4) COUNTDOWN
     =================================================================== */

  var letzteSekunde = null;           // damit nur bei Änderung neu gezeichnet wird
  var timerEl = {
    tage: $('t-tage'),
    stunden: $('t-stunden'),
    minuten: $('t-minuten'),
    sekunden: $('t-sekunden')
  };

  /** Zweistellig machen: 7 → "07" */
  function zweistellig(n) { return (n < 10 ? '0' : '') + n; }

  /** Eine Zahl im Stein setzen + kleine „Hüpf“-Animation */
  function setzeZahl(el, wert) {
    if (el.textContent === wert) { return; }
    el.textContent = wert;
    el.classList.remove('tick');
    void el.offsetWidth;             // Trick: Animation neu starten
    el.classList.add('tick');
  }

  function aktualisiereTimer(restMs) {
    var restSek = Math.ceil(restMs / 1000);
    if (restSek === letzteSekunde) { return; }
    letzteSekunde = restSek;

    var tage = Math.floor(restSek / 86400);
    var stunden = Math.floor((restSek % 86400) / 3600);
    var minuten = Math.floor((restSek % 3600) / 60);
    var sekunden = restSek % 60;

    setzeZahl(timerEl.tage, zweistellig(tage));
    setzeZahl(timerEl.stunden, zweistellig(stunden));
    setzeZahl(timerEl.minuten, zweistellig(minuten));
    setzeZahl(timerEl.sekunden, zweistellig(sekunden));

    aktualisiereFortschritt();
    aktualisiereFinale(restSek);
  }

  // ---- Bau-Fortschritt (Reihe aus 10 Steinen) --------------------------
  var FORTSCHRITT_STEINE = 10;
  var fortschrittFarben = ['rot', 'gelb', 'blau', 'gruen', 'orange'];

  function baueFortschritt() {
    if (!START || isNaN(START) || START >= ZIEL) {
      $('fortschritt').hidden = true;
      return;
    }
    var box = $('fortschritt-steine');
    for (var i = 0; i < FORTSCHRITT_STEINE; i++) {
      var s = document.createElement('span');
      s.className = 'mini-stein mini-stein--' + fortschrittFarben[i % fortschrittFarben.length];
      box.appendChild(s);
    }
  }

  function aktualisiereFortschritt() {
    if (!START || isNaN(START) || START >= ZIEL) { return; }
    var anteil = (Zeit.jetzt() - START) / (ZIEL - START);
    anteil = Math.max(0, Math.min(1, anteil));
    var voll = Math.floor(anteil * FORTSCHRITT_STEINE);
    var steine = $('fortschritt-steine').children;
    for (var i = 0; i < steine.length; i++) {
      steine[i].classList.toggle('mini-stein--voll', i < voll);
    }
    $('fortschritt-text').textContent = 'Bau-Fortschritt: ' + Math.floor(anteil * 100) + ' %';
  }

  // ---- Finale: riesige Zahl in den letzten 10 Sekunden ------------------
  function aktualisiereFinale(restSek) {
    var finale = $('finale');
    if (restSek <= 10 && restSek > 0) {
      finale.hidden = false;
      var zahl = $('finale-zahl');
      zahl.textContent = restSek;
      zahl.classList.remove('puls');
      void zahl.offsetWidth;
      zahl.classList.add('puls');
    } else {
      finale.hidden = true;
    }
  }

  // ---- Wechselnde Hinweise unter dem Timer ------------------------------
  var hinweisIndex = 0;
  function starteHinweise() {
    var liste = (CFG.countdown && CFG.countdown.hinweise) || [];
    var el = $('hinweis');
    if (!liste.length) { el.hidden = true; return; }
    setzeText(el, liste[0]);
    setInterval(function () {
      if (zustand !== 'countdown') { return; }
      el.classList.add('hinweis--weg');
      setTimeout(function () {
        hinweisIndex = (hinweisIndex + 1) % liste.length;
        setzeText(el, liste[hinweisIndex]);
        el.classList.remove('hinweis--weg');
      }, 450);
    }, 6000);
  }


  /* ===================================================================
     5) HAUPT-PRÜFUNG: läuft alle 250 ms
     =================================================================== */

  function pruefe() {
    var rest = ZIEL - Zeit.jetzt();

    if (rest > 0) {
      // Noch vor dem Geburtstag
      if (zustand !== 'countdown') {
        zeige('countdown');
        letzteSekunde = null;
      }
      aktualisiereTimer(rest);
    } else {
      // Geburtstag ist da (oder schon vorbei)
      if (zustand === 'countdown') {
        // Die Zeit ist GERADE live abgelaufen → großes Konfetti!
        zeige('tor');
        if (window.Konfetti) {
          window.Konfetti.explosion(window.innerWidth / 2, window.innerHeight / 2, 220);
          window.Konfetti.regen(3500);
        }
      } else if (zustand === null) {
        // Seite wurde nach dem Zeitpunkt geöffnet
        zeige('tor');
      }
      // 'tor' und 'feier' bleiben einfach, wie sie sind
    }
  }


  /* ===================================================================
     6) DIE GEBURTSTAGSSEITE AUFBAUEN
     =================================================================== */

  var feierGebaut = false;

  function oeffneFeier() {
    zeige('feier');
    if (!feierGebaut) {
      baueAlter();
      baueCollage();
      baueWuensche();
      baueBrief();
      baueGeschenk();
      starteEinblenden();
      feierGebaut = true;
    }
    starteMusik();
    if (window.Konfetti) {
      window.Konfetti.explosion(window.innerWidth / 2, window.innerHeight / 3, 200);
      window.Konfetti.regen(5000);
    }
  }

  // ---- 6a) Alter als Bausteine ----------------------------------------
  function baueAlter() {
    var box = $('alter');
    box.textContent = '';
    if (CFG.alter === null || CFG.alter === undefined || CFG.alter === '') {
      box.hidden = true;
      return;
    }
    var farben = ['rot', 'gelb', 'blau', 'gruen'];
    String(CFG.alter).split('').forEach(function (ziffer, i) {
      var stein = document.createElement('div');
      stein.className = 'stein stein--' + farben[i % farben.length] + ' alter__stein';
      stein.style.setProperty('--verzoegerung', (0.4 + i * 0.25) + 's');
      stein.innerHTML = '<span class="noppen"><i></i><i></i></span>';
      var zahl = document.createElement('span');
      zahl.className = 'stein__zahl';
      zahl.textContent = ziffer;
      stein.appendChild(zahl);
      box.appendChild(stein);
    });
  }

  // ---- 6b) Foto-Collage -----------------------------------------------
  // Feste, leicht schiefe Winkel – sieht aus wie an die Wand gepinnt
  var WINKEL = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2, 2, -1, 3.5, -3.5, 1];
  var fotos = [];

  /** Ist dieser Collage-Eintrag ein Video? */
  function istVideo(foto) {
    return foto.typ === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(foto.datei || '');
  }

  /**
   * Videos in der Collage laufen nur, solange sie sichtbar sind
   * (spart Akku und Datenvolumen auf dem Handy).
   */
  var videoBeobachter = ('IntersectionObserver' in window) ? new IntersectionObserver(function (eintraege) {
    eintraege.forEach(function (e) {
      if (e.isIntersecting) {
        var versuch = e.target.play();
        if (versuch && versuch.catch) { versuch.catch(function () { /* z. B. Stromsparmodus – egal */ }); }
      } else {
        e.target.pause();
      }
    });
  }, { threshold: 0.25 }) : null;

  function beobachteVideo(video) {
    if (wenigBewegung) { return; }            // „Bewegung reduzieren“: Videos nicht automatisch starten
    if (videoBeobachter) { videoBeobachter.observe(video); }
    else { video.autoplay = true; }
  }

  function baueCollage() {
    var raster = $('collage-raster');
    raster.textContent = '';
    fotos = (CFG.collage && CFG.collage.fotos) || [];

    fotos.forEach(function (foto, i) {
      var figur = document.createElement('figure');
      figur.className = 'polaroid einblenden';
      if (foto.breit) { figur.classList.add('polaroid--breit'); }
      if (foto.hoch) { figur.classList.add('polaroid--hoch'); }
      figur.style.setProperty('--dreh', WINKEL[i % WINKEL.length] + 'deg');
      figur.style.setProperty('--verzoegerung', ((i % 4) * 0.08) + 's');
      figur.tabIndex = 0;
      figur.setAttribute('role', 'button');
      figur.setAttribute('aria-label', (istVideo(foto) ? 'Video' : 'Foto') + ' vergrößern: ' + (ersetze(foto.text) || 'Foto ' + (i + 1)));

      // Foto ODER Video? (Video = Dateiendung .mp4/.webm/.mov/.m4v oder typ: "video")
      var medium;
      if (istVideo(foto)) {
        medium = document.createElement('video');
        medium.src = foto.datei;
        medium.muted = true;              // stumm, sonst blockiert der Browser das Autoplay
        medium.loop = true;
        medium.playsInline = true;        // iPhone: nicht automatisch in Vollbild springen
        medium.setAttribute('playsinline', '');
        medium.setAttribute('muted', '');
        medium.preload = 'metadata';
        if (foto.vorschau) { medium.poster = foto.vorschau; }
        figur.classList.add('polaroid--video');
        beobachteVideo(medium);
      } else {
        medium = document.createElement('img');
        medium.src = foto.datei;
        medium.alt = ersetze(foto.text) || 'Foto ' + (i + 1);
        medium.loading = 'lazy';
        medium.decoding = 'async';
      }

      // Falls eine Datei fehlt: hübscher Platzhalter statt kaputtem Bild
      medium.addEventListener('error', function () {
        var ersatz = document.createElement('div');
        ersatz.className = 'polaroid__fehlt';
        ersatz.innerHTML = '<span>' + (istVideo(foto) ? '🎬' : '📷') + '</span>';
        var p = document.createElement('small');
        p.textContent = (istVideo(foto) ? 'Video fehlt oder Format nicht abspielbar: ' : 'Foto fehlt: ') + foto.datei;
        ersatz.appendChild(p);
        medium.replaceWith(ersatz);
        figur.classList.add('polaroid--kaputt');
      });

      figur.appendChild(medium);

      // Kleines ▶-Symbol, damit man sieht: hier gibt's ein Video mit Ton
      if (istVideo(foto)) {
        var abzeichen = document.createElement('span');
        abzeichen.className = 'polaroid__play';
        abzeichen.setAttribute('aria-hidden', 'true');
        abzeichen.textContent = '▶';
        figur.appendChild(abzeichen);
      }

      if (foto.text) {
        var unterschrift = document.createElement('figcaption');
        unterschrift.textContent = ersetze(foto.text);
        figur.appendChild(unterschrift);
      }

      figur.addEventListener('click', function () { oeffneLightbox(i); });
      figur.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oeffneLightbox(i); }
      });

      raster.appendChild(figur);
    });

    if (!fotos.length) { $('collage').hidden = true; }
  }

  // ---- 6c) Glückwunsch-Karten -----------------------------------------
  function baueWuensche() {
    var raster = $('wuensche-raster');
    raster.textContent = '';
    var liste = (CFG.wuensche && CFG.wuensche.liste) || [];
    var farben = ['rot', 'gelb', 'blau', 'gruen', 'orange'];

    liste.forEach(function (w, i) {
      var karte = document.createElement('div');
      karte.className = 'wunsch einblenden';
      karte.style.setProperty('--verzoegerung', ((i % 3) * 0.12) + 's');

      var symbol = document.createElement('span');
      symbol.className = 'wunsch__symbol wunsch__symbol--' + farben[i % farben.length];
      symbol.textContent = w.symbol || '🎉';
      symbol.setAttribute('aria-hidden', 'true');

      var titel = document.createElement('h3');
      titel.className = 'wunsch__titel';
      setzeText(titel, w.titel);

      var text = document.createElement('p');
      text.className = 'wunsch__text';
      setzeText(text, w.text);

      karte.appendChild(symbol);
      karte.appendChild(titel);
      karte.appendChild(text);
      raster.appendChild(karte);
    });

    if (!liste.length) { $('wuensche').hidden = true; }
  }

  // ---- 6d) Der Brief --------------------------------------------------
  function baueBrief() {
    var box = $('brief-text');
    box.textContent = '';
    var absaetze = (CFG.brief && CFG.brief.absaetze) || [];
    absaetze.forEach(function (absatz, i) {
      var p = document.createElement('p');
      p.className = 'einblenden';
      p.style.setProperty('--verzoegerung', (i * 0.05) + 's');
      setzeText(p, absatz);
      box.appendChild(p);
    });
  }

  // ---- 6e) Das Geschenk -----------------------------------------------
  function baueGeschenk() {
    var g = CFG.geschenk || {};
    var pdf = g.pdf || 'geschenk/anleitung.pdf';

    $('pdf-oeffnen').href = pdf;
    $('pdf-download').href = pdf;
    $('pdf-download').setAttribute('download', g.downloadName || 'Bauanleitung.pdf');

    var nummer = $('geschenk-nummer');
    if (g.setNummer) { nummer.textContent = 'Set-Nr. ' + g.setNummer; } else { nummer.hidden = true; }

    var stein = $('geschenkstein');
    stein.addEventListener('click', function () {
      if (stein.classList.contains('offen')) { return; }
      stein.classList.add('offen');
      stein.setAttribute('aria-expanded', 'true');
      stein.setAttribute('aria-label', 'Geschenk geöffnet');
      document.querySelector('.geschenk__buehne').classList.add('offen');

      // Konfetti genau aus dem Geschenk heraus
      var r = stein.getBoundingClientRect();
      if (window.Konfetti) {
        window.Konfetti.explosion(r.left + r.width / 2, r.top + r.height / 3, 180);
      }

      // Inhalt kurz danach einblenden
      setTimeout(function () {
        var inhalt = $('geschenk-inhalt');
        inhalt.hidden = false;
        requestAnimationFrame(function () { inhalt.classList.add('sichtbar'); });
        setTimeout(function () {
          inhalt.scrollIntoView({ behavior: wenigBewegung ? 'auto' : 'smooth', block: 'center' });
        }, 300);
      }, wenigBewegung ? 0 : 700);
    });
  }

  // ---- Elemente beim Scrollen sanft einblenden --------------------------
  function starteEinblenden() {
    var elemente = document.querySelectorAll('#feier .einblenden');
    if (!('IntersectionObserver' in window) || wenigBewegung) {
      Array.prototype.forEach.call(elemente, function (el) { el.classList.add('sichtbar'); });
      return;
    }
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('sichtbar');
          beobachter.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(elemente, function (el) { beobachter.observe(el); });
  }


  /* ===================================================================
     7) LIGHTBOX (Foto-Großansicht)
     =================================================================== */

  var lbIndex = 0;
  var lbVorherFokus = null;
  var lb = $('lightbox');

  function zeigeLightboxFoto(i) {
    if (!fotos.length) { return; }
    lbIndex = (i + fotos.length) % fotos.length;
    var foto = fotos[lbIndex];
    var bild = $('lb-bild');
    var video = $('lb-video');
    video.pause();

    if (istVideo(foto)) {
      // Video groß und MIT Ton abspielen (Klick des Nutzers erlaubt das)
      bild.hidden = true;
      bild.removeAttribute('src');
      video.hidden = false;
      video.src = foto.datei;
      if (foto.vorschau) { video.poster = foto.vorschau; } else { video.removeAttribute('poster'); }
      video.muted = false;
      var versuch = video.play();
      if (versuch && versuch.catch) { versuch.catch(function () { /* Nutzer kann selbst auf Play drücken */ }); }
    } else {
      video.hidden = true;
      video.removeAttribute('src');
      video.load();
      bild.hidden = false;
      bild.src = foto.datei;
      bild.alt = ersetze(foto.text) || '';
    }
    $('lb-text').textContent = ersetze(foto.text);
    $('lb-zaehler').textContent = (lbIndex + 1) + ' / ' + fotos.length;
  }

  function oeffneLightbox(i) {
    lbVorherFokus = document.activeElement;
    zeigeLightboxFoto(i);
    lb.hidden = false;
    document.body.classList.add('kein-scroll');
    requestAnimationFrame(function () { lb.classList.add('offen'); });
    $('lb-schliessen').focus();
  }

  function schliesseLightbox() {
    $('lb-video').pause();
    lb.classList.remove('offen');
    document.body.classList.remove('kein-scroll');
    setTimeout(function () { lb.hidden = true; }, 200);
    if (lbVorherFokus) { lbVorherFokus.focus(); }
  }

  $('lb-schliessen').addEventListener('click', schliesseLightbox);
  $('lb-weiter').addEventListener('click', function () { zeigeLightboxFoto(lbIndex + 1); });
  $('lb-zurueck').addEventListener('click', function () { zeigeLightboxFoto(lbIndex - 1); });

  // Klick auf den dunklen Hintergrund schließt
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lightbox__figur')) { schliesseLightbox(); }
  });

  // Tastatur: Esc, ←, →
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) { return; }
    if (e.key === 'Escape') { schliesseLightbox(); }
    if (e.key === 'ArrowRight') { zeigeLightboxFoto(lbIndex + 1); }
    if (e.key === 'ArrowLeft') { zeigeLightboxFoto(lbIndex - 1); }
  });

  // Wischen auf dem Handy
  var wischStartX = null;
  lb.addEventListener('touchstart', function (e) { wischStartX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (wischStartX === null) { return; }
    var dx = e.changedTouches[0].clientX - wischStartX;
    if (Math.abs(dx) > 50) { zeigeLightboxFoto(lbIndex + (dx < 0 ? 1 : -1)); }
    wischStartX = null;
  });


  /* ===================================================================
     8) MUSIK
     -------------------------------------------------------------------
     Der eigentliche Player steckt in playlist.js. Hier wird er nur
     gestartet und kurz pausiert, wenn ein Video in der Großansicht
     mit Ton läuft (danach geht die Musik automatisch weiter).
     =================================================================== */

  function starteMusik() {
    if (window.Playlist && window.Playlist.vorhanden()) { window.Playlist.starten(); }
  }

  $('lb-video').addEventListener('play', function () {
    if (window.Playlist) { window.Playlist.unterbrechen(); }
  });
  function musikFortsetzen() {
    if (window.Playlist) { window.Playlist.fortsetzen(); }
  }
  $('lb-video').addEventListener('pause', musikFortsetzen);
  $('lb-video').addEventListener('ended', musikFortsetzen);


  /* ===================================================================
     9) DEKO: schwebende Bausteine im Hintergrund
     =================================================================== */

  function baueSchwebeSteine() {
    if (wenigBewegung) { return; }
    var box = $('schwebe-steine');
    var farben = ['rot', 'gelb', 'blau', 'gruen', 'orange'];
    var anzahl = window.innerWidth < 600 ? 8 : 14;
    for (var i = 0; i < anzahl; i++) {
      var s = document.createElement('span');
      s.className = 'schwebe-stein mini-stein mini-stein--voll mini-stein--' + farben[i % farben.length];
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.setProperty('--groesse', (0.6 + Math.random() * 0.9).toFixed(2));
      s.style.animationDuration = (18 + Math.random() * 22).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 40).toFixed(1) + 's';
      box.appendChild(s);
    }
  }


  /* ===================================================================
     10) START
     =================================================================== */

  fuelleAlleTexte();
  $('zieldatum-text').textContent = zieldatumText();
  baueFortschritt();
  baueSchwebeSteine();
  starteHinweise();

  $('tor-knopf').addEventListener('click', oeffneFeier);

  pruefe();
  setInterval(pruefe, 250);

  // Wenn der Tab im Hintergrund war und wieder geöffnet wird: sofort prüfen
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { pruefe(); }
  });


  /* ===================================================================
     11) SCHNITTSTELLE FÜR DIE TESTOBERFLÄCHE
     -------------------------------------------------------------------
     Nur in test.html verfügbar. In der finalen index.html gibt es diese
     Steuerung NICHT – so kann man den Timer dort nicht über die
     Browser-Konsole „überspringen“.
     =================================================================== */

  if (TESTMODUS) {
    window.GeburtstagApp = {
      ziel: ZIEL,
      config: CFG,
      jetzt: function () { return Zeit.jetzt(); },
      zustand: function () { return zustand; },
      /** Simulierte Uhrzeit setzen (Millisekunden-Zeitstempel) */
      setzeZeit: function (zeitstempel) {
        Zeit.versatz = zeitstempel - Date.now();
        pruefe();
      },
      /** Zurück zur echten Uhrzeit */
      echteZeit: function () { Zeit.versatz = 0; pruefe(); },
      versatz: function () { return Zeit.versatz; },
      /** Tor überspringen und direkt die Feier zeigen */
      oeffneFeier: function () {
        if (ZIEL - Zeit.jetzt() > 0) { Zeit.versatz = ZIEL - Date.now() + 1000; }
        pruefe();
        oeffneFeier();
      },
      pruefe: pruefe
    };
  }
})();
