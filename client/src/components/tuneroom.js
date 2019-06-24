import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, navigate } from '@reach/router';
import SpotifyPlayer from 'react-spotify-web-playback';
import axios from 'axios';
import styled from 'styled-components';

import * as firebase from 'firebase';
import { SpotifyContext } from '../context/spotifyContext';
import { SpotifyApi } from '../api/spotify/spotifyConfig';
import { db } from '../api/firebase/firebaseConfig';
import { vote } from '../api/firebase/firebaseApi';

import AddSong from './addsong';

const PlayerContainer = styled.div`
  svg {
    width: 25px;
    height: 25px;
  }
`;

function TuneRoom() {
  const user = JSON.parse(localStorage.getItem('user'));
  const accessCode = localStorage.getItem('accessCode');

  const {
    documentUri,
    // setDocumentUri,
    documentPlaylistName,
    documentState,
    setDocumentState,
  } = useContext(SpotifyContext);

  const [localDocumentUri, setLocalDocumentUri] = useState(documentUri);

  useEffect(() => {
    setDocumentState(documentState);
    setLocalDocumentUri(documentUri.uri);
  }, [documentState, documentUri.uri, setDocumentState]);

  const [trackResults, setTrackResults] = useState({
    data: '',
  });

  const voteResults = useRef({
    user: '',
    tracksVoted: [],
  });

  const handleVote = trackUri => {
    return vote(trackUri, accessCode, documentState);
  };

  useEffect(() => {
    function getRefreshToken() {
      axios
        .post('/auth/refresh_token', user)
        .then(response => {
          const { accessToken, refreshToken } = response.data;
          SpotifyApi.setAccessToken(accessToken);
          SpotifyApi.setRefreshToken(refreshToken);
        })
        .catch(err => {
          console.log(err);
          return err;
        });
    }
    // getRefreshToken();
    setInterval(() => {
      getRefreshToken();
    }, 3000000);
  }, [user]);

  useEffect(() => {
    db.collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        const { accessToken } = doc.data();
        SpotifyApi.setAccessToken(accessToken);
        localStorage.setItem(
          'user',
          JSON.stringify({ uid: doc.id, ...doc.data() })
        );
      });
  });

  // useEffect(() => {
  // updates in realtime from firestore
  // db.collection('playlists')
  //   .doc(accessCode)
  //   .onSnapshot(doc => {
  //     doc.data().tracks.map(data => {
  //       SpotifyApi.getPlaylistTracks(playlistId).then(tracks => {
  //         tracks.body.items.map(spotifyApi => {
  //           // TODO:
  //           // increment vote count for specific track
  //           // if (data.trackUri === spotifyApi.track.uri) {
  //           //   db.doc(`playlists/${accessCode}`).set({
  //           //   }, { merge: true });
  //           // }
  //         });
  //       });
  //     });
  //   });
  // }, []);

  // useEffect(() => {
  //   // setDocumentUri(documentUri.uri);
  //   setLocalDocumentUri(documentUri.uri);
  // }, [documentUri.uri, documentState]);

  return (
    <div>
      {voteResults.current.tracksVoted}
      <button type="submit" onClick={() => navigate('/')}>
        Return to Home
      </button>
      <div>
        <div>{documentPlaylistName.data}</div>
        <PlayerContainer>
          <SpotifyPlayer
            token={user.accessToken}
            uris={`${localDocumentUri}`}
          />
        </PlayerContainer>
        {/** PLAYLSIT RESULTS */}
        {documentState !== '' ? (
          documentState.map((result, i) => {
            console.log(result.album.images[2].url);
            return (
              <>
                {/* what's currently playing? */}
                {i === 1 && <h2>Up Next:</h2>}
                <ul key={i}>
                  <li>
                    <div>{result.name}</div>
                    <button
                      type="submit"
                      onClick={() => handleVote(result.uri)}
                    >
                      vote
                    </button>
                    {/* Cant parse further down?? */}
                    <img src={result.album.images[2].url} alt="album-cover" />
                  </li>
                </ul>
              </>
            );
          })
        ) : (
          <div>
            <h2>
              <Link to="/join">Join a playlist</Link> to see what's playing
            </h2>
          </div>
        )}
        <AddSong />
        &nbsp;
        {trackResults.data !== '' && (
          <button type="submit" onClick={() => setTrackResults({ data: '' })}>
            Close Search
          </button>
        )}
        <br />
      </div>
    </div>
  );
}

export default TuneRoom;
