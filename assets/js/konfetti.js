/* =====================================================================
   konfetti.js  –  KONFETTI AUS MINI-BAUSTEINEN
   =====================================================================
   Eigenes, kleines Konfetti-Skript (keine fremde Bibliothek nötig,
   funktioniert also auch offline).

   Benutzung (aus anderen Skripten):
     Konfetti.explosion(x, y, anzahl)   → Explosion an Position x/y (Pixel)
     Konfetti.regen(dauerInMs)          → Konfetti regnet von oben
     Konfetti.stopp()                   → alles sofort entfernen

   Jedes Konfetti-Teil ist ein kleiner Baustein (Rechteck mit Noppe),
   der von der Schwerkraft nach unten gezogen wird und sich dreht.
   ===================================================================== */

(function () {
  'use strict';

  // ---- Einstellungen, an denen du drehen kannst -----------------------
  var FARBEN = ['#e4312b', '#ffcd03', '#006cb7', '#00a650', '#f58220', '#ffffff', '#a05eb5'];
  var SCHWERKRAFT = 0.18;   // wie stark Teile nach unten fallen
  var LUFTWIDERSTAND = 0.992; // bremst die Teile langsam ab (1 = gar nicht)
  var MAX_TEILE = 600;      // Obergrenze, damit schwache Handys nicht ruckeln

  // Wenn der Nutzer im Betriebssystem „Bewegung reduzieren“ aktiviert hat,
  // gibt es deutlich weniger Konfetti.
  var wenigBewegung = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.getElementById('konfetti');
  if (!canvas) { return; }
  var ctx = canvas.getContext('2d');
  var teile = [];          // alle aktuell fliegenden Konfetti-Teile
  var laeuft = false;      // läuft die Animationsschleife gerade?
  var regenBis = 0;        // Zeitstempel, bis wann es noch regnet

  // ---- Leinwand an Bildschirmgröße anpassen (inkl. Retina-Schärfe) -----
  function groesseAnpassen() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', groesseAnpassen);
  groesseAnpassen();

  function zufall(min, max) { return min + Math.random() * (max - min); }

  // ---- Ein neues Konfetti-Teil erzeugen --------------------------------
  function neuesTeil(x, y, vx, vy) {
    var breite = zufall(8, 14);
    return {
      x: x, y: y,
      vx: vx, vy: vy,
      breite: breite,
      hoehe: breite * zufall(0.55, 0.75),
      farbe: FARBEN[(Math.random() * FARBEN.length) | 0],
      winkel: zufall(0, Math.PI * 2),
      drehung: zufall(-0.2, 0.2),
      kippen: zufall(0, Math.PI * 2),     // sorgt für den „Flatter“-Effekt
      kippTempo: zufall(0.05, 0.15),
      leben: 1
    };
  }

  // ---- Ein Teil zeichnen: kleiner Stein mit Noppe ----------------------
  function zeichne(t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.winkel);
    // Flattern: Breite schwankt (sieht aus, als würde sich das Teil drehen)
    ctx.scale(Math.cos(t.kippen), 1);
    ctx.globalAlpha = Math.max(0, Math.min(1, t.leben));
    ctx.fillStyle = t.farbe;
    // Körper
    ctx.fillRect(-t.breite / 2, -t.hoehe / 2, t.breite, t.hoehe);
    // Noppe oben
    ctx.fillRect(-t.breite / 5, -t.hoehe / 2 - t.hoehe * 0.3, t.breite / 2.5, t.hoehe * 0.3);
    // leichter Schatten unten für Plastik-Look
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-t.breite / 2, t.hoehe / 4, t.breite, t.hoehe / 4);
    ctx.restore();
  }

  // ---- Die Animationsschleife (ca. 60x pro Sekunde) --------------------
  function schleife() {
    var jetzt = performance.now();

    // Während es „regnet“, kommen ständig neue Teile von oben dazu
    if (jetzt < regenBis && teile.length < MAX_TEILE) {
      var proFrame = wenigBewegung ? 1 : 4;
      for (var i = 0; i < proFrame; i++) {
        teile.push(neuesTeil(zufall(0, window.innerWidth), -20, zufall(-1, 1), zufall(1, 3)));
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var j = teile.length - 1; j >= 0; j--) {
      var t = teile[j];
      t.vy += SCHWERKRAFT;
      t.vx *= LUFTWIDERSTAND;
      t.vy *= LUFTWIDERSTAND;
      t.x += t.vx + Math.sin(t.kippen) * 0.6;
      t.y += t.vy;
      t.winkel += t.drehung;
      t.kippen += t.kippTempo;
      // Unten raus? → langsam ausblenden und entfernen
      if (t.y > window.innerHeight + 30) { t.leben -= 0.05; }
      if (t.leben <= 0) { teile.splice(j, 1); continue; }
      zeichne(t);
    }

    if (teile.length > 0 || jetzt < regenBis) {
      requestAnimationFrame(schleife);
    } else {
      laeuft = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function starten() {
    if (!laeuft) { laeuft = true; requestAnimationFrame(schleife); }
  }

  // ---- Öffentliche Funktionen ------------------------------------------
  window.Konfetti = {
    /** Explosion an einer Stelle (Standard: Bildschirmmitte) */
    explosion: function (x, y, anzahl) {
      x = (typeof x === 'number') ? x : window.innerWidth / 2;
      y = (typeof y === 'number') ? y : window.innerHeight / 2;
      anzahl = anzahl || 140;
      if (wenigBewegung) { anzahl = Math.round(anzahl / 5); }
      for (var i = 0; i < anzahl && teile.length < MAX_TEILE; i++) {
        var winkel = zufall(0, Math.PI * 2);
        var tempo = zufall(4, 13);
        // leicht nach oben gerichtet, damit es schön „hochspritzt“
        teile.push(neuesTeil(x, y, Math.cos(winkel) * tempo, Math.sin(winkel) * tempo - 5));
      }
      starten();
    },

    /** Konfetti-Regen von oben, dauer in Millisekunden */
    regen: function (dauer) {
      regenBis = performance.now() + (dauer || 4000);
      starten();
    },

    /** Alles sofort stoppen */
    stopp: function () {
      teile = [];
      regenBis = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
})();
