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
    { kategoria: "Magyar költő, író", szoveg: "PETŐFI SÁNDOR" }, { kategoria: "Magyar költő, író", szoveg: "ARANY JÁNOS" },
    { kategoria: "Magyar település", szoveg: "SIÓFOK" }, { kategoria: "Magyar település", szoveg: "DEBRECEN" },
    { kategoria: "Étel és ital", szoveg: "GULYÁSLEVES" }, { kategoria: "Étel és ital", szoveg: "SOMLÓI GALUSKA" },
    { kategoria: "Film vagy sorozat", szoveg: "STAR WARS" }, { kategoria: "Film vagy sorozat", szoveg: "GLADIÁTOR" },
    { kategoria: "Használati tárgy", szoveg: "MIKROHULLÁMÚ SÜTŐ" }, { kategoria: "Használati tárgy", szoveg: "PORSZÍVÓ" }
];

function getRoom(roomName) {
    if (!rooms[roomName]) {
        rooms[roomName] = {
            jatekosok: [],
            aktualisJatekosIndex: 0,
            kivalasztottFeladvany: null,
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
    
    // Ellenőrizzük, van-e egyáltalán aktív játékos
    const vanAktiv = room.jatekosok.some(j => !j.tavolVan && !j.disconnected);
    if (!vanAktiv) return; // Ha mindenki elment, megáll a léptetés

    do {
        room.aktualisJatekosIndex = (room.aktualisJatekosIndex + 1) % room.jatekosok.length;
    } while (room.jatekosok[room.aktualisJatekosIndex].tavolVan || room.jatekosok[room.aktualisJatekosIndex].disconnected);
    
    io.to(roomName).emit('turn_changed', { aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex] });
}

io.on('connection', (socket) => {
    
    socket.on('join_room', (data) => {
        const szoba = String(data.szoba).trim().toLowerCase();
        const nev = String(data.nev).trim();
        const sessionId = data.sessionId; // A kliens titkos azonosítója a visszacsatlakozáshoz

        socket.join(szoba);
        socket.data.roomName = szoba;
        socket.data.nev = nev;

        const room = getRoom(szoba);
        
        let jatekos = room.jatekosok.find(j => j.sessionId === sessionId);
        
        if (!jatekos) {
            // Új belépő
            room.jatekosok.push({ 
                id: socket.id, sessionId: sessionId, nev: nev, 
                korPont: 0, osszPont: 0, tavolVan: false, disconnected: false 
            });
            console.log(`[BELÉPÉS] ${nev} csatlakozott -> '${szoba}'`);
        } else {
            // Visszacsatlakozó (Rejoin)
            jatekos.id = socket.id;
            jatekos.nev = nev;
            jatekos.disconnected = false;
            console.log(`[VISSZATÉRT] ${nev} visszatért a(z) '${szoba}' szobába.`);
            
            // Értesítjük a többieket
            socket.to(szoba).emit('player_reconnected', { nev: nev });
            
            // Leküldjük neki az aktuális játékállapotot
            if (room.jatekMegy && room.kivalasztottFeladvany) {
                socket.emit('rejoin_game_state', {
                    jatekosok: room.jatekosok,
                    aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
                    kategoria: room.kivalasztottFeladvany.kategoria,
                    maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk)
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
        room.jatekosok.forEach(j => { j.korPont = 0; });
        room.aktualisJatekosIndex = -1; 
        room.kitalaltBetuk = [];
        room.kivalasztottFeladvany = UjFeladvanySorsolasa(room);

        if (!room.kivalasztottFeladvany) return;
        KovetkezoJatekos(roomName); // Ráléptetjük az első aktív játékosra

        io.to(roomName).emit('game_started', {
            jatekosok: room.jatekosok,
            aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
            kategoria: room.kivalasztottFeladvany.kategoria,
            maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk)
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

    // --- KIMARADÁS ÉS VISSZATÉRÉS LOGIKA ---
    socket.on('skip_turn', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (room) {
            const jatekos = room.jatekosok.find(j => j.id === socket.id);
            if(jatekos) {
                jatekos.tavolVan = true; // Státusz megőrzése a körökön át
                io.to(roomName).emit('player_skipped', { jatekosNev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);
                // Csak akkor kell léptetni, ha épp ő volt soron
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
                jatekos.tavolVan = false; // Visszaállt aktívra
                io.to(roomName).emit('player_returned', { jatekosNev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);
            }
        }
    });

    // --- KÖVETKEZŐ KÖRÖK INDÍTÁSA ---
    socket.on('next_random_puzzle', () => {
        const roomName = socket.data.roomName;
        const room = rooms[roomName];
        if (!room) return;
        room.kivalasztottFeladvany = UjFeladvanySorsolasa(room);
        if(!room.kivalasztottFeladvany) return; 
        io.to(roomName).emit('atvezeto_inditasa');
        setTimeout(() => {
            room.jatekosok.forEach(j => { j.korPont = 0; });
            room.kitalaltBetuk = [];
            KovetkezoJatekos(roomName);
            io.to(roomName).emit('game_started', {
                jatekosok: room.jatekosok, aktualisJatekos: room.jatekosok[room.aktualisJatekosIndex],
                kategoria: room.kivalasztottFeladvany.kategoria,
                maszkoltSzoveg: maszkolSzoveg(room.kivalasztottFeladvany.szoveg, room.kitalaltBetuk)
            });
        }, 10000);
    });

    // Chat
    socket.on('send_chat_message', (msg) => {
        const roomName = socket.data.roomName;
        if (roomName) io.to(roomName).emit('chat_message_received', { nev: socket.data.nev, uzenet: msg });
    });

    // --- SZAKADÁS (DISCONNECT) KEZELÉSE ---
    socket.on('disconnect', () => {
        const roomName = socket.data.roomName;
        if (roomName && rooms[roomName]) {
            const room = rooms[roomName];
            const jatekos = room.jatekosok.find(j => j.id === socket.id);
            if (jatekos) {
                jatekos.disconnected = true; // Nem töröljük, csak megjelöljük offline-nak
                console.log(`[KILÉPETT] ${jatekos.nev} kapcsolata megszakadt.`);
                
                io.to(roomName).emit('player_disconnected', { nev: jatekos.nev });
                io.to(roomName).emit('lobby_update', room.jatekosok);

                // Ha ő jött volna, ugrunk egyet
                if (room.jatekMegy && room.jatekosok[room.aktualisJatekosIndex] && room.jatekosok[room.aktualisJatekosIndex].id === socket.id) {
                    KovetkezoJatekos(roomName);
                }

                // Ha mindenki offline, takarítsuk ki a szobát a memóriából
                const mindenkiOffline = room.jatekosok.every(j => j.disconnected);
                if (mindenkiOffline) delete rooms[roomName];
            }
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Szerver fut a ${PORT}-es porton!`);
});