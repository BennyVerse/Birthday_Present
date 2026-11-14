/* =====================================================================
   playlist.js  –  DER MUSIK-PLAYER MIT PLAYLIST
   =====================================================================
   Spielt die Songs aus config.js → musik.playlist nacheinander ab.

   Zwei Anzeigen, die immer synchron sind:
     1. Mini-Player (#player), schwebt unten links:
        „Läuft gerade: Titel – Künstler“, Play/Pause, vor/zurück,
        Fortschrittsbalken (anklickbar zum Spulen), aufklappbare Liste
     2. Playlist-Abschnitt (#playlist) auf der Geburtstagsseite:
        alle Songs untereinander, der aktuelle ist hervorgehoben

   Zusätzlich: Steuerung über Sperrbildschirm / Kopfhörer-Tasten am
   Handy (Media Session API), sofern der Browser das unterstützt.

   Öffentliche Funktionen (werden von main.js benutzt):
     Playlist.vorhanden()        → gibt es überhaupt Songs?
     Playlist.starten()          → Player einblenden (+ Autostart)
     Playlist.verstecken()       → Player ausblenden + pausieren
     Playlist.unterbrechen()     → kurz pausieren (z. B. für ein Video)
     Playlist.fortsetzen()       → nach einer Unterbrechung weiterspielen
     Playlist.abschnittBauen()   → Playlist-Abschnitt auf der Seite füllen
   ===================================================================== */

(function () {
  'use strict';

  var CFG = window.GEBURTSTAG_CONFIG || {};

  /* -------------------------------------------------------------------
     1) EINSTELLUNGEN LESEN
     -------------------------------------------------------------------
     Unterstützt auch die alte Schreibweise  musik: "musik/song.mp3"  */
  var M = CFG.musik;
  if (typeof M === 'string') {
    M = M ? { playlist: [{ datei: M, titel: M.split('/').pop().replace(/\.[^.]+$/, '') }] } : { playlist: [] };
  }
  M = M || { playlist: [] };

  var EINST = {
    titel: M.titel || 'Deine Lieblingssongs',
    untertitel: M.untertitel || '',
    abschnittAnzeigen: M.abschnittAnzeigen !== false,
    autoStart: M.autoStart !== false,
    wiederholen: M.wiederholen !== false,
    zufall: M.zufall === true,
    lautstaerke: typeof M.lautstaerke === 'number' ? M.lautstaerke
               : (typeof CFG.musikLautstaerke === 'number' ? CFG.musikLautstaerke : 0.5)
  };

  // Songs (nur Einträge mit Datei)
  var songs = (M.playlist || []).filter(function (s) { return s && s.datei; }).map(function (s, i) {
    return {
      datei: s.datei,
      titel: s.titel || s.datei.split('/').pop(),
      kuenstler: s.kuenstler || '',
      notiz: s.notiz || '',
      kaputt: false,
      index: i
    };
  });

  // Abspiel-Reihenfolge (bei „zufall“ gemischt)
  var reihenfolge = songs.map(function (_, i) { return i; });
  if (EINST.zufall) {
    for (var r = reihenfolge.length - 1; r > 0; r--) {
      var z = Math.floor(Math.random() * (r + 1));
      var tmp = reihenfolge[r]; reihenfolge[r] = reihenfolge[z]; reihenfolge[z] = tmp;
    }
  }

  function $(id) { return document.getElementById(id); }


  /* -------------------------------------------------------------------
     2) ZUSTAND
     ------------------------------------------------------------------- */
  var audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = Math.max(0, Math.min(1, EINST.lautstaerke));

  var position = 0;            // Position in „reihenfolge“
  var geladen = false;         // wurde schon ein Song in audio geladen?
  var unterbrochen = false;    // wurde für ein Video kurz pausiert?
  var fehlerInFolge = 0;       // schützt vor Endlosschleife, wenn ALLE Dateien fehlen

  function aktuellerSong() { return songs[reihenfolge[position]]; }


  /* -------------------------------------------------------------------
     3) HILFSFUNKTIONEN
     ------------------------------------------------------------------- */
  /** 125 Sekunden → "2:05" */
  function zeit(sek) {
    if (!isFinite(sek) || sek < 0) { return '0:00'; }
    var m = Math.floor(sek / 60);
    var s = Math.floor(sek % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function spielt() { return !audio.paused && !audio.ended; }


  /* -------------------------------------------------------------------
     4) ABSPIELEN
     ------------------------------------------------------------------- */
  /** Song an Position p laden (und optional direkt abspielen) */
  function lade(p, abspielen) {
    if (!songs.length) { return; }
    position = (p + reihenfolge.length) % reihenfolge.length;
    var song = aktuellerSong();
    audio.src = song.datei;
    geladen = true;
    anzeigeAktualisieren();
    mediaSessionAktualisieren();
    if (abspielen) { play(); }
  }

  function play() {
    if (!songs.length) { return; }
    if (!geladen) { lade(position, false); }
    var versuch = audio.play();
    if (versuch && versuch.catch) {
      versuch.catch(function () {
        // Browser hat Autoplay blockiert → Nutzer muss selbst auf Play drücken
        anzeigeAktualisieren();
      });
    }
  }

  function pause() { audio.pause(); }

  function umschalten() { if (spielt()) { pause(); } else { play(); } }

  function weiter() { lade(position + 1, true); }

  function zurueck() {
    // Wie bei Spotify: nach mehr als 3 Sekunden springt „zurück“ an den Songanfang
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    lade(position - 1, true);
  }

  /** Einen bestimmten Song (Index in der Config-Liste) abspielen */
  function spieleSong(songIndex) {
    var p = reihenfolge.indexOf(songIndex);
    if (p === -1) { return; }
    if (p === position && geladen) { umschalten(); return; }
    lade(p, true);
  }

  // Song zu Ende → nächster (oder Ende der Playlist)
  audio.addEventListener('ended', function () {
    var letzter = position === reihenfolge.length - 1;
    if (letzter && !EINST.wiederholen) {
      lade(0, false);
      return;
    }
    weiter();
  });

  // Datei fehlt / Format nicht abspielbar → überspringen
  audio.addEventListener('error', function () {
    if (!geladen) { return; }
    var song = aktuellerSong();
    if (song) {
      song.kaputt = true;
      console.warn('Song konnte nicht geladen werden und wird übersprungen:', song.datei);
    }
    fehlerInFolge++;
    if (fehlerInFolge >= songs.length) {
      // Keiner der Songs funktioniert → Player komplett ausblenden
      console.warn('Keiner der Songs in der Playlist konnte geladen werden.');
      $('player').hidden = true;
      document.body.classList.remove('mit-player');
      anzeigeAktualisieren();
      return;
    }
    anzeigeAktualisieren();
    weiter();
  });

  audio.addEventListener('playing', function () { fehlerInFolge = 0; });
  audio.addEventListener('play', anzeigeAktualisieren);
  audio.addEventListener('pause', anzeigeAktualisieren);
  audio.addEventListener('loadedmetadata', anzeigeAktualisieren);
  audio.addEventListener('timeupdate', fortschrittAktualisieren);


  /* -------------------------------------------------------------------
     5) ANZEIGE AKTUALISIEREN (Mini-Player + Abschnitt + Liste)
     ------------------------------------------------------------------- */
  function anzeigeAktualisieren() {
    var song = aktuellerSong();
    var laeuft = spielt();
    // body-Klasse → lässt z. B. die Schallplatte im Playlist-Abschnitt drehen
    document.body.classList.toggle('musik-spielt', laeuft);

    // Mini-Player
    var player = $('player');
    if (player && song) {
      player.classList.toggle('spielt', laeuft);
      $('player-titel').textContent = song.titel;
      $('player-kuenstler').textContent = song.kuenstler;
      $('player-kuenstler').hidden = !song.kuenstler;
      $('player-label').textContent = laeuft ? 'Läuft gerade' : 'Pausiert';
      $('player-play').setAttribute('aria-label', laeuft ? 'Pause' : 'Abspielen');
      $('player-nummer').textContent = (position + 1) + ' / ' + songs.length;
    }

    // Alle Listen (Mini-Player-Liste + Abschnitt) markieren
    var eintraege = document.querySelectorAll('[data-song]');
    Array.prototype.forEach.call(eintraege, function (li) {
      var idx = Number(li.getAttribute('data-song'));
      var aktiv = song && idx === song.index;
      li.classList.toggle('aktiv', aktiv);
      li.classList.toggle('spielt', aktiv && laeuft);
      li.classList.toggle('kaputt', songs[idx].kaputt);
      li.setAttribute('aria-current', aktiv ? 'true' : 'false');
    });

    // Funktioniert KEIN einziger Song? → Player und Abschnitt ausblenden
    if (songs.length && songs.every(function (x) { return x.kaputt; })) {
      if (player) { player.hidden = true; }
      if ($('playlist')) { $('playlist').hidden = true; }
      document.body.classList.remove('mit-player');
    }

    fortschrittAktualisieren();
  }

  function fortschrittAktualisieren() {
    var dauer = audio.duration;
    var anteil = (isFinite(dauer) && dauer > 0) ? audio.currentTime / dauer : 0;
    var balken = $('player-balken');
    if (balken) { balken.style.width = (anteil * 100) + '%'; }
    var zeitEl = $('player-zeit');
    if (zeitEl) { zeitEl.textContent = zeit(audio.currentTime) + ' / ' + zeit(dauer); }
    var leiste = $('player-fortschritt');
    if (leiste) { leiste.setAttribute('aria-valuenow', Math.round(anteil * 100)); }
  }


  /* -------------------------------------------------------------------
     6) LISTEN AUFBAUEN
     ------------------------------------------------------------------- */
  /** Ein Listeneintrag (wird für beide Listen benutzt) */
  function baueEintrag(song, nummer, mitNotiz) {
    var li = document.createElement('li');
    li.className = 'song';
    li.setAttribute('data-song', song.index);

    var knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'song__knopf';
    knopf.setAttribute('aria-label', 'Abspielen: ' + song.titel + (song.kuenstler ? ' von ' + song.kuenstler : ''));

    // Nummer bzw. Equalizer-Animation, wenn dieser Song läuft
    var links = document.createElement('span');
    links.className = 'song__links';
    links.setAttribute('aria-hidden', 'true');
    links.innerHTML = '<span class="song__nummer"></span>' +
      '<span class="eq"><i></i><i></i><i></i><i></i></span>';
    links.firstChild.textContent = nummer;

    var text = document.createElement('span');
    text.className = 'song__text';
    var t = document.createElement('span');
    t.className = 'song__titel';
    t.textContent = song.titel;
    text.appendChild(t);
    if (song.kuenstler) {
      var k = document.createElement('span');
      k.className = 'song__kuenstler';
      k.textContent = song.kuenstler;
      text.appendChild(k);
    }
    if (mitNotiz && song.notiz) {
      var n = document.createElement('span');
      n.className = 'song__notiz';
      n.textContent = song.notiz;
      text.appendChild(n);
    }

    var dauer = document.createElement('span');
    dauer.className = 'song__dauer';
    dauer.setAttribute('data-dauer', song.index);

    knopf.appendChild(links);
    knopf.appendChild(text);
    knopf.appendChild(dauer);
    knopf.addEventListener('click', function () { spieleSong(song.index); });
    li.appendChild(knopf);
    return li;
  }

  /** Songlängen im Hintergrund ermitteln (lädt nur die Metadaten) */
  function dauernLaden() {
    songs.forEach(function (song) {
      var a = new Audio();
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () {
        var felder = document.querySelectorAll('[data-dauer="' + song.index + '"]');
        Array.prototype.forEach.call(felder, function (f) { f.textContent = zeit(a.duration); });
        a.removeAttribute('src');
      });
      a.addEventListener('error', function () {
        song.kaputt = true;
        var felder = document.querySelectorAll('[data-dauer="' + song.index + '"]');
        Array.prototype.forEach.call(felder, function (f) { f.textContent = 'fehlt'; });
        anzeigeAktualisieren();
      });
      a.src = song.datei;
    });
  }

  var listenGebaut = false;

  function listenBauen() {
    if (listenGebaut) { return; }
    listenGebaut = true;

    // a) Liste im Mini-Player (aufklappbar) – in Abspiel-Reihenfolge
    var miniListe = $('player-liste');
    reihenfolge.forEach(function (idx, p) {
      miniListe.appendChild(baueEintrag(songs[idx], p + 1, false));
    });

    // b) Abschnitt auf der Seite
    var abschnitt = $('playlist');
    if (abschnitt) {
      if (!EINST.abschnittAnzeigen) {
        abschnitt.hidden = true;
      } else {
        abschnitt.hidden = false;
        $('playlist-titel').textContent = EINST.titel;
        var ut = $('playlist-untertitel');
        if (EINST.untertitel) { ut.textContent = EINST.untertitel; } else { ut.hidden = true; }
        var liste = $('playlist-liste');
        reihenfolge.forEach(function (idx, p) {
          liste.appendChild(baueEintrag(songs[idx], p + 1, true));
        });
      }
    }

    dauernLaden();
    anzeigeAktualisieren();
  }


  /* -------------------------------------------------------------------
     7) KNÖPFE DES MINI-PLAYERS
     ------------------------------------------------------------------- */
  function knoepfeVerbinden() {
    $('player-play').addEventListener('click', umschalten);
    $('player-play-mini').addEventListener('click', umschalten);
    $('player-weiter').addEventListener('click', weiter);
    $('player-zurueck').addEventListener('click', zurueck);

    // Liste auf-/zuklappen
    var listenKnopf = $('player-listenknopf');
    listenKnopf.addEventListener('click', function () {
      var offen = $('player-liste').hidden;
      $('player-liste').hidden = !offen;
      listenKnopf.setAttribute('aria-expanded', String(offen));
      $('player').classList.toggle('liste-offen', offen);
    });

    // Einklappen auf ein kleines Symbol
    $('player-minimieren').addEventListener('click', function () {
      var zu = $('player').classList.toggle('minimiert');
      $('player-minimieren').setAttribute('aria-label', zu ? 'Player ausklappen' : 'Player einklappen');
    });

    // Klick in den Fortschrittsbalken = an diese Stelle spulen
    var leiste = $('player-fortschritt');
    leiste.addEventListener('click', function (e) {
      if (!isFinite(audio.duration)) { return; }
      var r = leiste.getBoundingClientRect();
      audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
    });
    // Tastatur: ← → spulen 5 Sekunden
    leiste.addEventListener('keydown', function (e) {
      if (!isFinite(audio.duration)) { return; }
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
    });
  }


  /* -------------------------------------------------------------------
     8) SPERRBILDSCHIRM / KOPFHÖRER-TASTEN (Media Session API)
     ------------------------------------------------------------------- */
  function mediaSessionAktualisieren() {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) { return; }
    var song = aktuellerSong();
    if (!song) { return; }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.titel,
        artist: song.kuenstler,
        album: 'Geburtstags-Playlist für ' + (CFG.name || 'dich')
      });
    } catch (e) { /* ältere Browser – egal */ }
  }

  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('nexttrack', weiter);
      navigator.mediaSession.setActionHandler('previoustrack', zurueck);
    } catch (e) { /* nicht unterstützt – egal */ }
  }


  /* -------------------------------------------------------------------
     9) ÖFFENTLICHE FUNKTIONEN
     ------------------------------------------------------------------- */
  var verbunden = false;

  window.Playlist = {
    vorhanden: function () { return songs.length > 0; },

    /** Player einblenden; bei autoStart sofort abspielen */
    starten: function () {
      if (!songs.length || !$('player')) { return; }
      if (!verbunden) { knoepfeVerbinden(); verbunden = true; }
      listenBauen();
      if (fehlerInFolge >= songs.length) { return; }
      $('player').hidden = false;
      document.body.classList.add('mit-player');
      if (!geladen) { lade(0, false); }
      if (EINST.autoStart) { play(); }
      anzeigeAktualisieren();
    },

    /** Player verstecken und pausieren (z. B. Testmodus zurück zum Countdown) */
    verstecken: function () {
      pause();
      if ($('player')) { $('player').hidden = true; }
      document.body.classList.remove('mit-player');
    },

    /** Kurz anhalten, z. B. während ein Video mit Ton läuft */
    unterbrechen: function () {
      if (spielt()) { unterbrochen = true; pause(); }
    },

    /** Nach einer Unterbrechung weiterspielen */
    fortsetzen: function () {
      if (unterbrochen) { unterbrochen = false; play(); }
    },

    /** Für das Test-Panel */
    songs: function () { return songs.slice(); }
  };
})();
