const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 2500;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'szerencsekerek.html'));
});

const rooms = {};
const kerekMezok = [1000, 1000, 2000, 2000, 4000, 4000, 5000, 5000, 6000, 8000, 10000, 15000, 20000, "CSŐD", "PASSZ"];
const alapFeladvanyok = [
    // Magyar költők, írók (10)
    { kategoria: "Magyar költő, író", szoveg: "PETŐFI SÁNDOR" }, { kategoria: "Magyar költő, író", szoveg: "ARANY JÁNOS" },
    { kategoria: "Magyar költő, író", szoveg: "RADNÓTI MIKLÓS" }, { kategoria: "Magyar költő, író", szoveg: "MÓRICZ ZSIGMOND" },
    { kategoria: "Magyar költő, író", szoveg: "ADY ENDRE" }, { kategoria: "Magyar költő, író", szoveg: "JÓZSEF ATTILA" },
    { kategoria: "Magyar költő, író", szoveg: "KOSZTOLÁNYI DEZSŐ" }, { kategoria: "Magyar költő, író", szoveg: "BABITS MIHÁLY" },
    { kategoria: "Magyar költő, író", szoveg: "GÁRDONYI GÉZA" }, { kategoria: "Magyar költő, író", szoveg: "SZABÓ MAGDA" },

    // Magyar települések (35)
    { kategoria: "Magyar település", szoveg: "SIÓFOK" }, { kategoria: "Magyar település", szoveg: "SZENTENDRE" },
    { kategoria: "Magyar település", szoveg: "VISEGRÁD" }, { kategoria: "Magyar település", szoveg: "HAJDÚSZOBOSZLÓ" },
    { kategoria: "Magyar település", szoveg: "KARCAG" }, { kategoria: "Magyar település", szoveg: "ESZTERGOM" },
    { kategoria: "Magyar település", szoveg: "TAPOLCA" }, { kategoria: "Magyar település", szoveg: "SOPRON" },
    { kategoria: "Magyar település", szoveg: "KESZTHELY" }, { kategoria: "Magyar település", szoveg: "BALATONFÜRED" },
    { kategoria: "Magyar település", szoveg: "HÓDMEZŐVÁSÁRHELY" }, { kategoria: "Magyar település", szoveg: "ZALAEGERSZEG" },
    { kategoria: "Magyar település", szoveg: "BÉKÉSCSABA" }, { kategoria: "Magyar település", szoveg: "GYULA" },
    { kategoria: "Magyar település", szoveg: "TIHANY" }, { kategoria: "Magyar település", szoveg: "DEBRECEN" },
    { kategoria: "Magyar település", szoveg: "MISKOLC" }, { kategoria: "Magyar település", szoveg: "SZEGED" },
    { kategoria: "Magyar település", szoveg: "PÉCS" }, { kategoria: "Magyar település", szoveg: "GYŐR" },
    { kategoria: "Magyar település", szoveg: "SZÉKESFEHÉRVÁR" }, { kategoria: "Magyar település", szoveg: "SZOMBATHELY" },
    { kategoria: "Magyar település", szoveg: "SZOLNOK" }, { kategoria: "Magyar település", szoveg: "TATABÁNYA" },
    { kategoria: "Magyar település", szoveg: "KAPOSVÁR" }, { kategoria: "Magyar település", szoveg: "ÉRD" },
    { kategoria: "Magyar település", szoveg: "DUNAKESZI" }, { kategoria: "Magyar település", szoveg: "CEGLÉD" },
    { kategoria: "Magyar település", szoveg: "BAJA" }, { kategoria: "Magyar település", szoveg: "VÁC" },
    { kategoria: "Magyar település", szoveg: "GÖDÖLLŐ" }, { kategoria: "Magyar település", szoveg: "KISKUNFÉLEGYHÁZA" },
    { kategoria: "Magyar település", szoveg: "SZENTES" }, { kategoria: "Magyar település", szoveg: "GYÖNGYÖS" },
    { kategoria: "Magyar település", szoveg: "KISVÁRDA" },

    // Külföldi város vagy ország (38)
    { kategoria: "Külföldi város vagy ország", szoveg: "OLASZORSZÁG" }, { kategoria: "Külföldi város vagy ország", szoveg: "AMSTERDAM" },
    { kategoria: "Külföldi város vagy ország", szoveg: "MADRID" }, { kategoria: "Külföldi város vagy ország", szoveg: "JAPÁN" },
    { kategoria: "Külföldi város vagy ország", szoveg: "BARCELONA" }, { kategoria: "Külföldi város vagy ország", szoveg: "PÁRIZS" },
    { kategoria: "Külföldi város vagy ország", szoveg: "LONDON" }, { kategoria: "Külföldi város vagy ország", szoveg: "SVÉDORSZÁG" },
    { kategoria: "Külföldi város vagy ország", szoveg: "FINNORSZÁG" }, { kategoria: "Külföldi város vagy ország", szoveg: "RÓMA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "AUSZTRÁLIA" }, { kategoria: "Külföldi város vagy ország", szoveg: "KANADA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "ARGENTÍNA" }, { kategoria: "Külföldi város vagy ország", szoveg: "TOKIÓ" },
    { kategoria: "Külföldi város vagy ország", szoveg: "BERLIN" }, { kategoria: "Külföldi város vagy ország", szoveg: "BÉCS" },
    { kategoria: "Külföldi város vagy ország", szoveg: "PRÁGA" }, { kategoria: "Külföldi város vagy ország", szoveg: "AMERIKAI EGYESÜLT ÁLLAMOK" },
    { kategoria: "Külföldi város vagy ország", szoveg: "SPANYOLORSZÁG" }, { kategoria: "Külföldi város vagy ország", szoveg: "FRANCIAORSZÁG" },
    { kategoria: "Külföldi város vagy ország", szoveg: "GÖRÖGORSZÁG" }, { kategoria: "Külföldi város vagy ország", szoveg: "TÖRÖKORSZÁG" },
    { kategoria: "Külföldi város vagy ország", szoveg: "EGYIPTOM" }, { kategoria: "Külföldi város vagy ország", szoveg: "KÍNA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "INDIA" }, { kategoria: "Külföldi város vagy ország", szoveg: "BRAZÍLIA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "MEXIKÓ" }, { kategoria: "Külföldi város vagy ország", szoveg: "NEW YORK" },
    { kategoria: "Külföldi város vagy ország", szoveg: "LOS ANGELES" }, { kategoria: "Külföldi város vagy ország", szoveg: "MOSZKVA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "PEKING" }, { kategoria: "Külföldi város vagy ország", szoveg: "DUBAI" },
    { kategoria: "Külföldi város vagy ország", szoveg: "ATHÉN" }, { kategoria: "Külföldi város vagy ország", szoveg: "LISSZABON" },
    { kategoria: "Külföldi város vagy ország", szoveg: "BOGOTA" }, { kategoria: "Külföldi város vagy ország", szoveg: "LIMA" },
    { kategoria: "Külföldi város vagy ország", szoveg: "KAIRÓ" }, { kategoria: "Külföldi város vagy ország", szoveg: "SYDNEY" },

    // Étel és ital (15)
    { kategoria: "Étel és ital", szoveg: "GULYÁSLEVES" }, { kategoria: "Étel és ital", szoveg: "SOMLÓI GALUSKA" },
    { kategoria: "Étel és ital", szoveg: "CAPPUCCINO" }, { kategoria: "Étel és ital", szoveg: "MARLENKA" },
    { kategoria: "Étel és ital", szoveg: "PALACSINTA" }, { kategoria: "Étel és ital", szoveg: "TÖLTÖTT KÁPOSZTA" },
    { kategoria: "Étel és ital", szoveg: "RÁNTOTT SAJT" }, { kategoria: "Étel és ital", szoveg: "GYÜMÖLCSLÉ" },
    { kategoria: "Étel és ital", szoveg: "FORRÓ CSOKOLÁDÉ" }, { kategoria: "Étel és ital", szoveg: "MEGGYLEVES" },
    { kategoria: "Étel és ital", szoveg: "TÚRÓS CSUSZA" }, { kategoria: "Étel és ital", szoveg: "MADÁRTEJ" },
    { kategoria: "Étel és ital", szoveg: "KAKAÓS CSIGA" }, { kategoria: "Étel és ital", szoveg: "LIMONÁDÉ" },
    { kategoria: "Étel és ital", szoveg: "HAMBURGER" },

    // Állatvilág (15)
    { kategoria: "Állatvilág", szoveg: "KANÁRI" }, { kategoria: "Állatvilág", szoveg: "CSÁSZÁRPINGVIN" },
    { kategoria: "Állatvilág", szoveg: "ZSIRÁF" }, { kategoria: "Állatvilág", szoveg: "ELEFÁNT" },
    { kategoria: "Állatvilág", szoveg: "OROSZLÁN" }, { kategoria: "Állatvilág", szoveg: "VÍZILÓ" },
    { kategoria: "Állatvilág", szoveg: "JEGESMEDVE" }, { kategoria: "Állatvilág", szoveg: "GORILLA" },
    { kategoria: "Állatvilág", szoveg: "KROKODIL" }, { kategoria: "Állatvilág", szoveg: "DELFIN" },
    { kategoria: "Állatvilág", szoveg: "KENGURU" }, { kategoria: "Állatvilág", szoveg: "VADKAN" },
    { kategoria: "Állatvilág", szoveg: "SZARVAS" }, { kategoria: "Állatvilág", szoveg: "MÓKUS" },
    { kategoria: "Állatvilág", szoveg: "BORZ" },

    // Film és sorozat (15)
    { kategoria: "Film vagy sorozat", szoveg: "GLADIÁTOR" }, { kategoria: "Film vagy sorozat", szoveg: "STAR WARS" },
    { kategoria: "Film vagy sorozat", szoveg: "JURASSIC PARK" }, { kategoria: "Film vagy sorozat", szoveg: "INCEPTION" },
    { kategoria: "Film vagy sorozat", szoveg: "SHREK" }, { kategoria: "Film vagy sorozat", szoveg: "TITANIC" },
    { kategoria: "Film vagy sorozat", szoveg: "AVATAR" }, { kategoria: "Film vagy sorozat", szoveg: "HARRY POTTER" },
    { kategoria: "Film vagy sorozat", szoveg: "MÁTRIX" }, { kategoria: "Film vagy sorozat", szoveg: "A GYŰRŰK URA" },
    { kategoria: "Film vagy sorozat", szoveg: "RESZKESSETEK BETÖRŐK" }, { kategoria: "Film vagy sorozat", szoveg: "JÓBARÁTOK" },
    { kategoria: "Film vagy sorozat", szoveg: "TRÓNOK HARCA" }, { kategoria: "Film vagy sorozat", szoveg: "AGYAMENŐK" },
    { kategoria: "Film vagy sorozat", szoveg: "BREAKING BAD" },

    // Használati tárgy (61)
    { kategoria: "Használati tárgy", szoveg: "MIKROHULLÁMÚ SÜTŐ" }, { kategoria: "Használati tárgy", szoveg: "VEZETÉK NÉLKÜLI EGÉR" },
    { kategoria: "Használati tárgy", szoveg: "KÁVÉFŐZŐ" }, { kategoria: "Használati tárgy", szoveg: "PORSZÍVÓ" },
    { kategoria: "Használati tárgy", szoveg: "MOSÓGÉP" }, { kategoria: "Használati tárgy", szoveg: "HAJSZÁRÍTÓ" },
    { kategoria: "Használati tárgy", szoveg: "HŰTŐSZEKRÉNY" }, { kategoria: "Használati tárgy", szoveg: "VASALÓ" },
    { kategoria: "Használati tárgy", szoveg: "MOSOGATÓGÉP" }, { kategoria: "Használati tárgy", szoveg: "FŰNYÍRÓ" },
    { kategoria: "Használati tárgy", szoveg: "OKOSTELEFON" }, { kategoria: "Használati tárgy", szoveg: "TABLET" },
    { kategoria: "Használati tárgy", szoveg: "BILLENTYŰZET" }, { kategoria: "Használati tárgy", szoveg: "FÜLHALLGATÓ" },
    { kategoria: "Használati tárgy", szoveg: "ASZTALI LÁMPA" }, { kategoria: "Használati tárgy", szoveg: "ÉBRESZTŐÓRA" },
    { kategoria: "Használati tárgy", szoveg: "FALIÓRA" }, { kategoria: "Használati tárgy", szoveg: "TÁVIRÁNYÍTÓ" },
    { kategoria: "Használati tárgy", szoveg: "KULCSTARTÓ" }, { kategoria: "Használati tárgy", szoveg: "NAPSZEMÜVEG" },
    { kategoria: "Használati tárgy", szoveg: "ESERNYŐ" }, { kategoria: "Használati tárgy", szoveg: "HÁTIZSÁK" },
    { kategoria: "Használati tárgy", szoveg: "PÉNZTÁRCA" }, { kategoria: "Használati tárgy", szoveg: "CSAVARHÚZÓ" },
    { kategoria: "Használati tárgy", szoveg: "KALAPÁCS" }, { kategoria: "Használati tárgy", szoveg: "FOGKEFE" },
    { kategoria: "Használati tárgy", szoveg: "TÜKÖR" }, { kategoria: "Használati tárgy", szoveg: "FÉSŰ" },
    { kategoria: "Használati tárgy", szoveg: "TÖRÖLKÖZŐ" }, { kategoria: "Használati tárgy", szoveg: "SZAPPANADAGOLÓ" },
    { kategoria: "Használati tárgy", szoveg: "KANAPÉ" }, { kategoria: "Használati tárgy", szoveg: "FOTEL" },
    { kategoria: "Használati tárgy", szoveg: "RUHASSZEKRÉNY" }, { kategoria: "Használati tárgy", szoveg: "KÉPKERET" },
    { kategoria: "Használati tárgy", szoveg: "KÖNYVESPOLC" }, { kategoria: "Használati tárgy", szoveg: "VIRÁGCSERÉP" },
    { kategoria: "Használati tárgy", szoveg: "PÁRNA" }, { kategoria: "Használati tárgy", szoveg: "TAKARÓ" },
    { kategoria: "Használati tárgy", szoveg: "LEPEDŐ" }, { kategoria: "Használati tárgy", szoveg: "OLLÓ" },
    { kategoria: "Használati tárgy", szoveg: "RAGASZTÓSZALAG" }, { kategoria: "Használati tárgy", szoveg: "TOLLTARTÓ" },
    { kategoria: "Használati tárgy", szoveg: "CSISZOLÓPAPÍR" }, { kategoria: "Használati tárgy", szoveg: "LÉTRA" },
    { kategoria: "Használati tárgy", szoveg: "POHÁR" }, { kategoria: "Használati tárgy", szoveg: "TÁNYÉR" },
    { kategoria: "Használati tárgy", szoveg: "EVŐESZKÖZ" }, { kategoria: "Használati tárgy", szoveg: "KANÁL" },
    { kategoria: "Használati tárgy", szoveg: "VILLA" }, { kategoria: "Használati tárgy", szoveg: "KÉS" },
    { kategoria: "Használati tárgy", szoveg: "VÁGÓDESZKA" }, { kategoria: "Használati tárgy", szoveg: "MERŐKANÁL" },
    { kategoria: "Használati tárgy", szoveg: "HABVERŐ" }, { kategoria: "Használati tárgy", szoveg: "SERPENYŐ" },
    { kategoria: "Használati tárgy", szoveg: "FAZÉK" }, { kategoria: "Használati tárgy", szoveg: "TEPSI" },
    { kategoria: "Használati tárgy", szoveg: "KUKTA" }, { kategoria: "Használati tárgy", szoveg: "RESZELŐ" },
    { kategoria: "Használati tárgy", szoveg: "DUGÓHÚZÓ" }, { kategoria: "Használati tárgy", szoveg: "KONZERVNYITÓ" },
    { kategoria: "Használati tárgy", szoveg: "HÚSKLOPFOLÓ" }
];

function getRoom(roomName) {
    if (!rooms[roomName]) {
        rooms[roomName] = {
            jatekosok: [],
            aktualisJatekosIndex: 0,
            kivalasztottFeladvany: null,
            feladvanyKeszitoId: null, // ÚJ: a feladványt feladó id-ja
            kitalaltBetuk: [],
            jatekMegy: false,
            feladvanyok: JSON.parse(JSON.stringify(alapFeladvanyok))
        };
    }
    return rooms[roomName];
}

function UjFeladvanySorsolasa(room) {
    if (!room.feladvanyok || room.feladvanyok.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * room.feladvanyok.length);
    return room.feladvanyok.splice(randomIndex, 1)[0];
}

function maszkolSzoveg(szoveg, kitalaltBetuk) {
    return szoveg.split('').map(c => c === ' ' ? ' ' : (kitalaltBetuk.includes(c) ? c : '_')).join('');
}

function KovetkezoJatekos(roomName) {
    const room = rooms[roomName];
    if (!room || room.jatekosok.length === 0) return;
    
    // Csak azok játszhatnak, akik nincsenek távol, nincsenek offline, ÉS nem ők adták fel a feladványt
    const vanAktiv = room.jatekosok.some(j => !j.tavolVan && !j.disconnected && j.id !== room.feladvanyKeszitoId);
    if (!vanAktiv) return; 

    do {
        room.aktualisJatekosIndex = (room.aktualisJatekosIndex + 1) % room.jatekosok.length;
    } while (
        room.jatekosok[room.aktualisJatekosIndex].tavolVan || 
        room.jatekosok[room.aktualisJatekosIndex].disconnected ||
        room.jatekosok[room.aktualisJatekosIndex].id === room.feladvanyKeszitoId
    );
    
    io.to(roomName).emit('turn_changed', { aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex] });
}

io.on('connection', (socket) => {
    
    socket.on('join_room', (data) => {
        const szoba = String(data.szoba).trim().toLowerCase();
        const nev = String(data.nev).trim();
        const sessionId = data.sessionId; 

        socket.join(szoba);
        socket.data.roomName = szoba;
        socket.data.nev = nev;

        const room = getRoom(szoba);
        let jatekos = room.jatekosok.find(j => j.sessionId === sessionId);
        
        if (!jatekos) {
            room.jatekosok.push({ 
                id: socket.id, sessionId: sessionId, nev: nev, 
                korPont: 0, osszPont: 0, tavolVan: false, disconnected: false 
            });
        } else {
            jatekos.id = socket.id;
            jatekos.nev = nev;
            jatekos.disconnected = false;
            socket.to(szoba).emit('player_reconnected', { nev: nev });
            
            if (room.jatekMegy && room.kivalasztottFeladvany) {
                socket.emit('rejoin_game_state', {
                    jatekosok: room.jatekosok,
                    aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
                    kategoria: room.kivalasztottFeladvany.kategoria,
                    maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk),
                    feladvanyKeszitoId: room.feladvanyKeszitoId
                });
            }
        }
        io.to(szoba).emit('lobby_update', room.jatekosok);
    });

    socket.on('start_game', () => {
        const roomName = socket.data.roomName;
        if (!roomName) return;
        const room = rooms[roomName];
        if (!room || room.jatekosok.length === 0) return;
        
        room.jatekMegy = true;
        room.feladvanyKeszitoId = null; // Gép által adott feladvány
        room.jatekosok.forEach(j => { j.korPont = 0; });
        room.aktualisJatekosIndex = -1; 
        room.kitalaltBetuk = [];
        room.kivalasztottFeladvany = UjFeladvanySorsolasa(room);

        if (!room.kivalasztottFeladvany) return;
        KovetkezoJatekos(roomName); 

        io.to(roomName).emit('game_started', {
            jatekosok: room.jatekosok,
            aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
            kategoria: room.kivalasztottFeladvany.kategoria,
            maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk),
            feladvanyKeszitoId: room.feladvanyKeszitoId
        });
    });

    socket.on('spin_wheel', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        io.to(roomName).emit('wheel_spinning', { jatekosNev: room.jatekosok[room.aktualisJatekosIndex].nev });
        
        setTimeout(() => {
            const result = kerekMezok[Math.floor(Math.random() * kerekMezok.length)];
            io.to(roomName).emit('spin_result', { result, aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex] });
            if (result === "CSŐD") {
                room.jatekosok[room.aktualisJatekosIndex].korPont = 0;
                setTimeout(() => KovetkezoJatekos(roomName), 2000);
            } else if (result === "PASSZ") {
                setTimeout(() => KovetkezoJatekos(roomName), 2000);
            }
        }, 5000);
    });

    socket.on('guess_letter', (data) => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        const { tipp, porgetesEredmeny } = data;
        const szo = room.kivalasztottFeladvany.szoveg;

        if (room.kitalaltBetuk.includes(tipp)) {
            io.to(roomName).emit('guess_response', { status: 'already_guessed', tipp, jatekosNev: room.jatekosok[room.aktualisJatekosIndex].nev });
            setTimeout(() => KovetkezoJatekos(roomName), 2000);
            return;
        }

        if (szo.includes(tipp)) {
            let talalatokSzama = szo.split('').filter(c => c === tipp).length;
            room.kitalaltBetuk.push(tipp);
            room.jatekosok[room.aktualisJatekosIndex].korPont += (porgetesEredmeny * talalatokSzama);
            let mindMegvan = szo.split('').every(c => c === ' ' || room.kitalaltBetuk.includes(c));
            let szoMaszkolva = maszkolSzoveg(szo, room.kitalaltBetuk);

            io.to(roomName).emit('guess_response', { 
                status: 'hit', tipp, talalatokSzama, jatekosok: room.jatekosok, 
                aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex], szoMaszkolva, mindMegvan 
            });

            if (mindMegvan) {
                room.jatekosok[room.aktualisJatekosIndex].osszPont += room.jatekosok[room.aktualisJatekosIndex].korPont;
                setTimeout(() => { 
                    io.to(roomName).emit('round_won', { nyertes: room.jatekosok[room.aktualisJatekosIndex], jatekosok: room.jatekosok, teljesSzo: szo }); 
                }, 2000);
            }
        } else {
            io.to(roomName).emit('guess_response', { status: 'miss', tipp, jatekosNev: room.jatekosok[room.aktualisJatekosIndex].nev });
            setTimeout(() => KovetkezoJatekos(roomName), 2000);
        }
    });

    socket.on('solve_puzzle', (tippMegfejtes) => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        if (tippMegfejtes.toUpperCase().trim() === room.kivalasztottFeladvany.szoveg) {
            room.jatekosok[room.aktualisJatekosIndex].osszPont += room.jatekosok[room.aktualisJatekosIndex].korPont;
            io.to(roomName).emit('round_won', { nyertes: room.jatekosok[room.aktualisJatekosIndex], jatekosok: room.jatekosok, teljesSzo: room.kivalasztottFeladvany.szoveg });
        } else {
            room.jatekosok[room.aktualisJatekosIndex].korPont = 0;
            io.to(roomName).emit('solve_failed', { jatekosNev: room.jatekosok[room.aktualisJatekosIndex].nev });
            setTimeout(() => KovetkezoJatekos(roomName), 2000);
        }
    });

    socket.on('leave_room', () => {
        const roomName = socket.data.roomName;
        if (!roomName) return;
        const room = rooms[roomName];
        if (!room) return;

        const pIndex = room.jatekosok.findIndex(j => j.id === socket.id);
        if (pIndex !== -1) {
            const jatekosNev = room.jatekosok[pIndex].nev;
            const voltSoron = (room.jatekMegy && pIndex === room.aktualisJatekosIndex);
            
            room.jatekosok.splice(pIndex, 1);
            socket.leave(roomName);
            delete socket.data.roomName; 

            if (room.jatekosok.length === 0) {
                delete rooms[roomName]; 
            } else {
                io.to(roomName).emit('player_left_permanently', { nev: jatekosNev });
                io.to(roomName).emit('lobby_update', room.jatekosok);
                
                if (room.jatekMegy) {
                    if (voltSoron) {
                        room.aktualisJatekosIndex = pIndex - 1; 
                        if (room.aktualisJatekosIndex < 0) room.aktualisJatekosIndex = room.jatekosok.length - 1;
                        KovetkezoJatekos(roomName);
                    } else if (pIndex < room.aktualisJatekosIndex) {
                        room.aktualisJatekosIndex--;
                    }
                }
            }
        }
    });

    socket.on('skip_turn', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (room) {
            const jatekos = room.jatekosok.find(j => j.id === socket.id);
            if(jatekos) {
                jatekos.tavolVan = true; 
                io.to(roomName).emit('player_skipped', { jatekosNev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);
                if (room.jatekosok[room.aktualisJatekosIndex].id === socket.id) {
                    KovetkezoJatekos(roomName);
                }
            }
        }
    });

    socket.on('return_to_game', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (room) {
            const jatekos = room.jatekosok.find(j => j.id === socket.id);
            if(jatekos) {
                jatekos.tavolVan = false; 
                io.to(roomName).emit('player_returned', { jatekosNev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);
            }
        }
    });

    socket.on('request_custom_puzzle', (celpontId) => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        const kero = room.jatekosok.find(j => j.id === socket.id);
        if(kero) {
            io.to(roomName).emit('custom_puzzle_delegated', { celpontId: celpontId, kerte: kero.nev });
        }
    });

    socket.on('submit_custom_puzzle', (data) => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        
        room.kivalasztottFeladvany = { kategoria: data.kategoria, szoveg: data.szoveg };
        room.feladvanyKeszitoId = socket.id; // Bejegyezzük, hogy Ő adta fel a feladványt!
        
        inditsdAzUjKort(roomName, room);
    });

    socket.on('next_random_puzzle', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        
        room.kivalasztottFeladvany = UjFeladvanySorsolasa(room);
        room.feladvanyKeszitoId = null; // Gép által adott feladványnál nincs feladó
        
        if(!room.kivalasztottFeladvany) return; 
        inditsdAzUjKort(roomName, room);
    });

    function inditsdAzUjKort(roomName, room) {
        io.to(roomName).emit('atvezeto_inditasa');
        setTimeout(() => {
            room.jatekosok.forEach(j => { j.korPont = 0; });
            room.kitalaltBetuk = [];
            room.aktualisJatekosIndex = -1;
            KovetkezoJatekos(roomName);
            
            io.to(roomName).emit('game_started', {
                jatekosok: room.jatekosok, 
                aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
                kategoria: room.kivalasztottFeladvany.kategoria,
                maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk),
                feladvanyKeszitoId: room.feladvanyKeszitoId
            });
        }, 10000);
    }

    socket.on('send_chat_message', (msg) => {
        const roomName = socket.data.roomName;
        if (roomName) io.to(roomName).emit('chat_message_received', { nev: socket.data.nev, uzenet: msg });
    });

    socket.on('disconnect', () => {
        const roomName = socket.data.roomName;
        if (roomName && rooms[roomName]) {
            const room = rooms[roomName];
            const jatekos = room.jatekosok.find(j => j.id === socket.id);
            if (jatekos) {
                jatekos.disconnected = true; 
                io.to(roomName).emit('player_disconnected', { nev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);

                if (room.jatekMegy && room.jatekosok[room.aktualisJatekosIndex] && room.jatekosok[room.aktualisJatekosIndex].id === socket.id) {
                    KovetkezoJatekos(roomName);
                }

                const mindenkiOffline = room.jatekosok.every(j => j.disconnected);
                if (mindenkiOffline) delete rooms[roomName];
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Szerver fut a ${PORT}-es porton!`);
});