/* =====================================================================
   config.js  –  DIE EINSTELLUNGEN DEINER GEBURTSTAGS-WEBSITE
   =====================================================================

   👉 Das ist die WICHTIGSTE Datei für dich!
   Hier stehen ALLE Texte, Namen, Daten, Fotos und Dateipfade.
   Du musst den restlichen Code NICHT anfassen, um die Seite
   persönlich zu machen – einfach hier die Werte ändern und speichern.

   Regeln zum Bearbeiten (damit nichts kaputtgeht):
   • Texte stehen immer in "Anführungszeichen".
   • Nach jedem Eintrag kommt ein Komma ,
   • Listen stehen in eckigen Klammern [ ... ]
   • Will man ein " im Text benutzen, schreibt man \"  (oder nimm „ “).
   • Der Platzhalter {name} wird überall automatisch durch den Namen
     deines Freundes ersetzt, {alter} durch das Alter, {von} durch dich.
   • Zeilen, die mit // anfangen, sind Kommentare (werden ignoriert).

   Nach dem Speichern: Seite im Browser neu laden (F5 / Strg+R).
   Testen am besten mit test.html (dort kannst du die Zeit „vorspulen“).
   ===================================================================== */

window.GEBURTSTAG_CONFIG = {

  /* -------------------------------------------------------------------
     1) PERSONEN
     ------------------------------------------------------------------- */

  // Name des Geburtstagskindes (wird groß in der Überschrift angezeigt)
  name: "Shy",

  // Welches Alter wird gefeiert? Zahl ohne Anführungszeichen, z. B. 27.
  // Wenn du das Alter NICHT anzeigen willst: null eintragen.
  alter: 22,

  // Dein Name bzw. wie du unterschreibst (erscheint unter dem Brief & im Footer)
  von: "bester Freund, Benny",


  /* -------------------------------------------------------------------
     2) ZEITPUNKT
     -------------------------------------------------------------------
     Format: "JJJJ-MM-TTTHH:MM:SS+Zeitzone"
     +01:00 = deutsche Winterzeit (MEZ). Im Sommer wäre es +02:00 (MESZ).
     Durch die feste Zeitzone springt der Timer für ALLE Besucher
     gleichzeitig um – auch wenn jemand gerade im Ausland ist.          */

  // Wann soll die Überraschung freigeschaltet werden?
  zielDatum: "2026-11-18T00:00:00+01:00",

  // Ab wann zählt der „Bau-Fortschritt“-Balken unter dem Timer?
  // (0 % an diesem Datum, 100 % am Zieldatum). null = Balken ausblenden.
  fortschrittStart: "2026-11-11T00:00:00+01:00",


  /* -------------------------------------------------------------------
     3) TEXTE AUF DER COUNTDOWN-SEITE (vor dem Geburtstag)
     ------------------------------------------------------------------- */

  countdown: {
    // Kleine Zeile über der Überschrift
    vorzeile: "Psst, {name} …",
    // Große Überschrift
    titel: "Hier wird gerade etwas für dich gebaut.",
    // Text unter der Überschrift
    untertitel: "Komm wieder, wenn der Timer abgelaufen ist oder beobachte den Timer. Vorher wird nichts verraten!",
    // Diese Hinweise wechseln sich alle paar Sekunden unter dem Timer ab
    hinweise: [
      "Geduld ist auch ein Baustein.",
      "Nein, auch Neuladen macht es nicht schneller. 😉",
      "Stein für Stein wird hier etwas zusammengesetzt …",
      "Tipp: Halte dir den Abend frei.",
      "Es hat etwas mit Steinen zu tun. Mehr wird nicht verraten.",
      "Um Mitternacht geht's los!"
    ]
  },


  /* -------------------------------------------------------------------
     4) DER „TÜR-ÖFFNER“ (erscheint nach Ablauf, bevor alles losgeht)
     -------------------------------------------------------------------
     Nötig, weil Browser Musik/Effekte erst nach einem Klick erlauben.  */

  tor: {
    titel: "Es ist so weit, {name}!",
    text: "Dein Geschenk ist fertig gebaut.",
    knopf: "Überraschung öffnen 🎁"
  },


  /* -------------------------------------------------------------------
     5) GLÜCKWUNSCH-BEREICH (ganz oben nach dem Öffnen)
     ------------------------------------------------------------------- */

  hero: {
    vorzeile: "18. November 2026",
    titel: "Alles Gute zum Geburtstag, {name}!",
    text: "Heute dreht sich alles um dich. Scroll mal ein bisschen runter – da wartet noch einiges auf dich."
  },


  /* -------------------------------------------------------------------
     6) FOTO-COLLAGE
     -------------------------------------------------------------------
     • Lege deine Fotos in den Ordner  bilder/
     • Trage sie hier mit genau demselben Dateinamen ein
       (GROSS/klein-Schreibung beachten! Foto1.JPG ≠ foto1.jpg)
     • datei:      Pfad zum Bild
     • text:       Bildunterschrift (darf auch leer sein: "")
     • breit/hoch: optional true → Bild nimmt in der Collage doppelt
                   so viel Platz in der Breite bzw. Höhe ein
     Du kannst beliebig viele Einträge hinzufügen oder löschen.

     🎬 VIDEOS: Statt eines Fotos geht auch ein Video (.mp4, .webm, .mov):
        { datei: "bilder/video1.mp4", text: "Unser Roadtrip", breit: true },
     • Läuft in der Collage stumm in Dauerschleife, sobald es sichtbar ist.
     • Antippen → Großansicht MIT Ton und Steuerung (Hintergrundmusik pausiert).
     • Optional:  vorschau: "bilder/video1.jpg"  → Standbild, bis das Video lädt.
     • Am besten MP4 (H.264), möglichst unter 10 MB (siehe README, Kapitel 5).  */

  collage: {
    titel: "Unsere Momente",
    untertitel: "Ein paar Erinnerungen, die zeigen, warum du der Beste bist.",
    fotos: [
      { datei: "bilder/Pic - Real - 1.png", text: "Mampfeln mit deiner Dame" },
      { datei: "videos/Vid - Dead by Daylight - 1.mp4", text: "Trevor is not here",       breit: true },
      { datei: "bilder/Pic - Meme - 1.png", text: "Wo Pirate Token? Wo Kiste?" },
      { datei: "videos/Vid - Elden Ring - 3.mp4", text: "Einfach um das Tor rum" },
      { datei: "bilder/Pic - Real - 2.png", text: "Nom Nom Nom",                 hoch: true },
      { datei: "bilder/Pic - Aniimo - 1.png", text: "Wir zwei in Aniimo" },
      { datei: "bilder/Pic - Real - 3.png", text: "Welch hübscher Mann!" },
      { datei: "videos/Vid - Dead by Daylight - 2.mp4", text: "2v8 immer aufregend!" },
      { datei: "bilder/Pic - Real - 4.png", text: "Beste Bank beim DnD!",                        hoch: true },
      { datei: "bilder/Pic - Real - 5.png", text: "Geiler Arsch" },
      { datei: "videos/Vid - Elden Ring - 4.mp4", text: "Ist das ein Hammer?",             breit: true },
      { datei: "bilder/Pic - Hazbin Hotel - 1.png", text: "Basically wir zwei" },
      { datei: "videos/Vid - Big Walk - 1.mp4", text: "Ich habe dir blind vertraut" },
      { datei: "bilder/Pic - Big Walk - 1.png", text: "Kleine Mittagspause",           hoch: true },
      { datei: "bilder/Pic - Real - 6.png", text: "Reaper macht Lobby unsicher" },
      { datei: "videos/Vid - Dead by Daylight - 3.mp4", text: "Wer is'n er?" },
      { datei: "bilder/Pic - Real - 7.png", text: "Ihr zwei Mausis",                     hoch: true },
      { datei: "bilder/Pic - Real - 8.png", text: "Hier begann alles" },
      { datei: "videos/Vid - Elden Ring - 1.mp4", text: "Willst du nochmal casten?",             breit: true },
      { datei: "bilder/Pic - Elden Ring - 1.png", text: "Elden Ring mit dir is peak!" },
      { datei: "videos/Vid - Elden Ring - 2.mp4", text: "Hier springen?" }
    ]
  },


  /* -------------------------------------------------------------------
     7) GLÜCKWÜNSCHE (kleine Karten)
     -------------------------------------------------------------------
     symbol: ein Emoji, titel: kurze Überschrift, text: ein Satz.     */

  wuensche: {
    titel: "Was ich dir wünsche",
    liste: [
      { symbol: "💪", titel: "Gesundheit",   text: "Damit du noch viele Jahre jeden Blödsinn mitmachen kannst." },
      { symbol: "😂", titel: "Lachen",       text: "Jeden Tag mindestens einen Grund, laut loszulachen." },
      { symbol: "🚀", titel: "Erfolg",       text: "Dass alles, was du dir vornimmst, auch klappt." },
      { symbol: "🌍", titel: "Abenteuer",    text: "Neue Orte, neue Geschichten – am besten mit mir dabei." },
      { symbol: "🧱", titel: "Bauzeit",      text: "Ruhige Abende, an denen du einfach mal abschalten kannst." },
      { symbol: "🍻", titel: "Gute Leute",   text: "Menschen um dich herum, die dich so feiern, wie du bist." }
    ]
  },


  /* -------------------------------------------------------------------
     8) DER PERSÖNLICHE BRIEF
     -------------------------------------------------------------------
     Jeder Eintrag in der Liste "absaetze" ist ein eigener Absatz.
     Schreib hier am besten deinen eigenen Text rein – das hier ist
     nur ein Beispiel, das du anpassen oder komplett ersetzen kannst. */

  brief: {
    titel: "Ein paar Worte an dich",
    anrede: "Lieber {name},",
    absaetze: [
      "heute wirst du {alter} – und ich wollte dir dieses Jahr nicht einfach nur eine Nachricht schreiben, sondern dir etwas bauen. Etwas, das zeigt, wie viel du mir bedeutest.",
      "Wir haben schon so viel zusammen erlebt: Abende, die viel zu lang wurden, Pläne, die nie aufgegangen sind, und Momente, über die wir uns heute noch kaputtlachen. Du warst da, wenn es gut lief – und erst recht, wenn es mal nicht so gut lief. Das ist nicht selbstverständlich, und ich weiß das zu schätzen.",
      "Ein bester Freund ist jemand, bei dem man nichts erklären muss. Jemand, mit dem man stundenlang reden oder einfach nur zusammen schweigen kann. Genau das bist du für mich.",
      "Ich wünsche dir ein Jahr voller guter Tage, verrückter Ideen und Menschen, die dich so feiern, wie du es verdienst. Und ich verspreche dir: Ich bin bei den meisten davon dabei.",
      "Fühl dich gedrückt – und jetzt scroll weiter, da wartet noch was auf dich!"
    ],
    gruss: "Dein",
    unterschrift: "{von}"
  },


  /* -------------------------------------------------------------------
     9) DAS GESCHENK (ganz am Ende)
     -------------------------------------------------------------------
     pdf: Pfad zur PDF-Datei mit der Bauanleitung.
     Ersetze die Datei geschenk/anleitung.pdf durch die echte Anleitung
     (gleicher Name) – oder ändere hier den Pfad.                     */

  geschenk: {
    titel: "Und jetzt: dein Geschenk!",
    text: "Klick auf den Baustein, um ihn zu öffnen.",
    // Wird nach dem Öffnen angezeigt:
    setName: "Dein neues LEGO®‑Set",   // spezieller Bindestrich, der nie umbricht
    setNummer: "",          // z. B. "10497" – leer lassen, wenn egal
    enthuellung: "Hier ist schon mal die Bauanleitung. Das Set selbst befindet sich im Geschenk – du kannst also direkt loslegen!",
    pdf: "geschenk/anleitung.pdf",
    knopfOeffnen: "📖 Bauanleitung öffnen",
    knopfDownload: "⬇️ Herunterladen",
    // Dateiname, unter dem die PDF beim Herunterladen gespeichert wird
    downloadName: "Bauanleitung.pdf"
  },


  /* -------------------------------------------------------------------
     10) MUSIK-PLAYLIST 🎵 (optional)
     -------------------------------------------------------------------
     So legst du die Playlist an:
       1. MP3-Dateien in den Ordner  musik/  legen
          (Dateinamen am besten klein, ohne Leerzeichen/Umlaute,
          z. B. "musik/song1.mp3" oder "musik/mr-brightside.mp3")
       2. Unten bei  playlist  pro Song einen Eintrag anlegen:
            datei:     Pfad zur MP3 (Pflicht)
            titel:     Name des Songs (wird angezeigt)
            kuenstler: Interpret/Band (optional)
            notiz:     optional – kleiner persönlicher Satz, z. B.
                       „Unser Song vom Roadtrip“ (erscheint in der Liste)
       3. Die Reihenfolge hier = Reihenfolge der Playlist.

     Was passiert auf der Website?
       • Die Musik startet beim Klick auf „Überraschung öffnen“.
       • Unten links schwebt ein Mini-Player: „Läuft gerade: …“,
         mit Pause/Play, vor/zurück, Fortschrittsbalken (anklickbar)
         und aufklappbarer Songliste.
       • Zusätzlich gibt es einen eigenen Playlist-Abschnitt auf der
         Seite, in dem man jeden Song direkt anklicken kann.
       • Läuft ein Video in der Großansicht, pausiert die Musik kurz.
       • Fehlt eine Datei, wird der Song einfach übersprungen.

     Keine Musik gewünscht? → playlist: []  (leere Liste)            */

  musik: {
    // Überschrift & Text des Playlist-Abschnitts auf der Seite
    titel: "Deine Lieblingssongs",
    untertitel: "Die Soundtracks für deinen Tag – drück auf einen Song, um ihn abzuspielen. Jedes Lied hat seine eigene Geschichte!",

    // Abschnitt auf der Seite anzeigen? (false = nur der Mini-Player)
    abschnittAnzeigen: true,

    // Soll die Musik nach „Überraschung öffnen“ automatisch starten?
    autoStart: true,

    // Nach dem letzten Song wieder von vorne beginnen?
    wiederholen: true,

    // Songs in zufälliger Reihenfolge abspielen?
    zufall: true,

    // Lautstärke: 0 = stumm, 1 = volle Lautstärke
    lautstaerke: 0.2,

    // ⬇️ HIER DEINE SONGS EINTRAGEN ⬇️
    playlist: [
      { datei: "musik/Love In A Bottle.mp3", titel: "Love In A Bottle", kuenstler: "VivziePop", notiz: "Es gibt nicht nur Alk in einer Flasche!" },
      { datei: "musik/Brighter.mp3", titel: "Brighter", kuenstler: "VivziePop", notiz: "Leuchte Heller als der Himmel über uns!" },
      { datei: "musik/Ringleader.mp3", titel: "Ringleader", kuenstler: "VivziePop", notiz: "Dein Jester stets zu Diensten!" },
      { datei: "musik/Elden Ring.mp3", titel: "Elden Ring", kuenstler: "FromSoftware", notiz: "Das Spiel das unsere Freundschaft gestärkt hat!" },
      { datei: "musik/Messmer the Impaler.mp3", titel: "Messmer the Impaler", kuenstler: "FromSoftware", notiz: "Dein Lieblingsboss aus Elden Ring!" },
      { datei: "musik/Muichiro.mp3", titel: "Muichiro's 7th Form", kuenstler: "Ufotable", notiz: "Alles ist in dichte Nebel gehüllt!" },
      { datei: "musik/Shinobu vs Doma.mp3", titel: "The Battle Begins", kuenstler: "Ufotable", notiz: "Ein kaltes Herz das sogar Insektengift standhielt!" },
      { datei: "musik/Delirious.mp3", titel: "Delirious", kuenstler: "MAPPA", notiz: "Hier wird erklärt wie man so ein geiler Typ sein kann wie du!" },
      { datei: "musik/Lost in Paradise.mp3", titel: "Lost in Paradise", kuenstler: "MAPPA", notiz: "Bei dem Lied ist Leben in Ordnung, genauso wie bei jeder Zocksession!" },
      { datei: "musik/Lost Woods.mp3", titel: "Lost Woods", kuenstler: "Nintendo", notiz: "Do Do Dooo, Do Do Dooo, Do Do Doo Do Dooo, Do Do Do Do Dooo!" },
      { datei: "musik/Majora's Mask.mp3", titel: "Majora's Mask", kuenstler: "Nintendo", notiz: "Eine Maske die deinem Namen alle Ehre macht.. SHYmenzio!" },
      { datei: "musik/BOTW.mp3", titel: "Breath of the Wild", kuenstler: "Nintendo", notiz: "Ich atme auch immer wie ein Wilder!" },
      { datei: "musik/Suavamente.mp3", titel: "Suavamente", kuenstler: "Suavamente", notiz: "Suavamente" },
      { datei: "musik/Big Walk.mp3", titel: "Big Walk", kuenstler: "House House", notiz: "Ein großer Schritt in dein neues Lebensjahr!" }
    ]
  },


  /* -------------------------------------------------------------------
     11) FUSSZEILE & SEITENTITEL
     ------------------------------------------------------------------- */

  fusszeile: "Mit ❤️ und vielen Bausteinen gebaut · {von}",

  // Titel im Browser-Tab (vor bzw. nach dem Geburtstag)
  tabTitelVorher: "Psst … 🎁",
  tabTitelNachher: "🎉 Alles Gute, {name}!"
};
