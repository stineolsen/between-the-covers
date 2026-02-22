import { useState, useEffect } from "react";
import { href, Link } from "react-router-dom";

const Howto = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold text-primary mb-3 drop-shadow-lg">
            Slik bruker du lydbokbiblioteket
          </h1>
          <p className="text-xl text-secondary font-medium max-w-2xl mx-auto">
            Denne guiden viser deg hvordan du kan høre på lydbøker fra
            lydbokbiblioteket – enten i nettleser eller på mobil/nettbrett.
          </p>
        </div>

        {/* Alternativ 1 */}
        <div
          className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
          style={{
            background:
              "linear-gradient(135deg, rgba(231, 193, 236, 0.4), rgba(241, 199, 204, 0.4))",
          }}
        >

          
          <h3 className="text-2xl font-bold text-primary mb-3">
            🔹Alternativ 1: Bruk lydbokbiblioteket i nettleser{" "}
          </h3>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            1. Åpne nettleseren din og gå til: {" "}
            <a
              href={"audiobooks.betweenthecovers.no"}
              className="gradient-text mb-2/90 hover:gradient-text transition-colors font-medium"
            >
              lydbokbibiloteket
            </a>
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            2. Logg inn med ditt brukernavn og passord.
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            3. Velg en lydbok og trykk på Spill av.
          </p>
          <p className="text-gray-700 max-w-3xl py-6 mx-auto leading-relaxed text-lg font-medium">
            Du kan også trykke deg inn på lenken på boka du vil lese, 
            den åpner da opp en side med boken i nettleser
          </p>
        </div>

        {/* Alternativ 2 */}
        <div
          className="mt-12 p-8 rounded-2xl text-center animate-fadeIn"
          style={{
            background:
              "linear-gradient(135deg, rgba(231, 193, 236, 0.4), rgba(241, 199, 204, 0.4))",
          }}
        >
          <h3 className="text-2xl font-bold text-primary mb-3">
            🔹Alternativ 2: Bruk lydbokbiblioteket i app (anbefalt){" "}
          </h3>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            1. Last ned <i>Plappa</i> (eller SoundLeaf) fra App Store eller
            Google Play
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            2. Åpne appen og velg <i>Audiobookshelf</i> som tjeneste
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            3. Skriv inn følgende informasjon:
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            - <b> Server: </b> audiobooks.betweenthecovers.no
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            - <b>Brukernavn: </b> XXX
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            - <b>Passord: </b> YYY
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed text-lg">
            4. Logg inn og velg en lydbok du vil høre på.
          </p>
        </div>

        <div className="mt-12 p-8 rounded-2xl text-center animate-fadeIn">
          <Link to="/books" className="btn-primary inline-block">
            Sjekk ut bøkene i bibiloteket her
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Howto;
