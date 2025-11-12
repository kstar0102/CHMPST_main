import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail,
  deleteUser,
  updatePassword,
} from '@react-native-firebase/auth';
import firestore, { Filter } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Timestamp } from '@react-native-firebase/firestore';
import CMGlobal from '../CMGlobal';

const updateUser = (
  userId: string,
  data: { [name: string]: any },
  callback?: Function,
) => {
  firestore()
    .collection('users')
    .doc(userId)
    .update(data)
    .then(() => {
      if (userId == getAuth().currentUser!.uid) {
        CMGlobal.user = { ...CMGlobal.user, ...data };
      }
      callback && callback({ isSuccess: true, value: 'Updated successfully!' });
    })
    .catch(error => {
      callback && callback({ isSuccess: false, value: 'Failed to update.' });
    });
};

const getUser = (userId: string, callback: Function) => {
  firestore()
    .collection('users')
    .doc(userId)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists()) {
        callback({ isSuccess: true, value: documentSnapshot.data() });
      } else {
        callback({ isSuccess: false, value: 'Can not get user information.' });
      }
    })
    .catch(error => {
      callback({ isSuccess: false, value: 'Failed to load user information.' });
    });
};

const setTeam = (
  teamId: string,
  team: { [name: string]: any },
  callback: Function,
) => {
  firestore()
    .collection('teams')
    .doc(teamId)
    .set(team)
    .then(() => {
      callback({ isSuccess: true });
    })
    .catch(error => {
      callback({ isSuccess: false, value: 'Failed to save team.' });
    });
};

const setEvent = (
  eventId: string,
  event: { [name: string]: any },
  callback: Function,
) => {
  firestore()
    .collection('events')
    .doc(eventId)
    .set(event)
    .then(() => {
      callback({ isSuccess: true, value: 'Added successfully!' });
    })
    .catch(error => {
      callback({ isSuccess: false, value: 'Failed to save event.' });
    });
};

const updateLeague = (
  leagueId: string,
  data: { [name: string]: any },
  callback: Function,
) => {
  firestore()
    .collection('league')
    .doc(leagueId)
    .update(data)
    .then(() => {
      callback({ isSuccess: true, value: 'Updated successfully!' });
    })
    .catch(error => {
      callback({ isSuccess: false, value: 'Failed to update.' });
    });
};

const saveGameStats = (
  gameId: string,
  gameStats: { [name: string]: any },
  callback: Function,
) => {
  firestore()
    .collection('gameStats')
    .doc(gameId)
    .set(gameStats)
    .then(() => {
      callback({ isSuccess: true, value: 'Game stats saved successfully!' });
    })
    .catch(error => {
      callback({ isSuccess: false, value: 'Failed to save game stats.' });
    });
};

export default {
  uploadImage: async (localUri: string, firebaseFilePathAndName: string) => {
    const imageRef = storage().ref(firebaseFilePathAndName);
    await imageRef
      .putFile(localUri, { contentType: 'image/jpg' })
      .catch(error => {
        return { isSuccess: false, value: error };
      });
    const url = await imageRef.getDownloadURL().catch(error => {
      return { isSuccess: false, value: error };
    });
    return { isSuccess: true, value: url };
  },

  register: (email: string, password: string, callback: Function) => {
    createUserWithEmailAndPassword(getAuth(), email, password)
      .then(() => {
        callback({ isSuccess: true, value: getAuth().currentUser });
      })
      .catch(error => {
        let message = '';
        switch (error.code) {
          case 'auth/email-already-in-use': {
            message = 'Email address is already in use.';
            break;
          }
          case 'auth/invalid-email': {
            message = 'Email address is invalid.';
            break;
          }
          default: {
            message = 'You can not register now.';
          }
        }
        callback({ isSuccess: false, value: message });
      });
  },

  login: (email: string, password: string, callback: Function) => {
    signInWithEmailAndPassword(getAuth(), email, password)
      .then(() => {
        getUser(
          getAuth().currentUser!.uid,
          (response: { [name: string]: any }) => {
            if (response.isSuccess) {
              CMGlobal.user = response.value;
              callback({ isSuccess: true, value: getAuth().currentUser });
            } else {
              callback({
                isSuccess: false,
                value: 'Failed to load user information.',
              });
            }
          },
        );
      })
      .catch(error => {
        let message = '';
        switch (error.code) {
          case 'auth/user-not-found': {
            message = 'No account with your email.';
            break;
          }
          case 'auth/wrong-password': {
            message = 'Password is wrong.';
            break;
          }
          default: {
            message = 'You can not login now.';
          }
        }
        callback({ isSuccess: false, value: message });
      });
  },

  forgotPassword: (email: string, callback: Function) => {
    sendPasswordResetEmail(getAuth(), email)
      .then(() => {
        callback({
          isSuccess: true,
          value: 'Password reset link has been sent to your email.',
        });
      })
      .catch(error => {
        console.log(error.code);
        let message = '';
        switch (error.code) {
          case 'auth/user-not-found': {
            message = 'No account with your email.';
            break;
          }
          default: {
            message = 'You can not reset password now.';
          }
        }
        callback({ isSuccess: false, value: message });
      });
  },

  updateUserEmail: (email: string, callback: Function) => {
    updateEmail(getAuth().currentUser!, email)
      .then(() => {
        callback({ isSuccess: true, value: 'Email has been updated.' });
      })
      .catch(error => {
        callback({
          isSuccess: false,
          value: 'Can not update email at the moment.',
        });
      });
  },

  updateUserPassword: (password: string, callback: Function) => {
    updatePassword(getAuth().currentUser!, password)
      .then(() => {
        callback({ isSuccess: true, value: 'Password has been changed.' });
      })
      .catch(error => {
        callback({
          isSuccess: false,
          value: 'Can not change password at the moment.',
        });
      });
  },

  getNewDocumentId: (collectionName: string) => {
    return firestore().collection(collectionName).doc().id;
  },

  setUser: (user: { [name: string]: any }, callback: Function) => {
    firestore()
      .collection('users')
      .doc(user.id)
      .set(user)
      .then(() => {
        CMGlobal.user = user;
        callback({ isSuccess: true });
      })
      .catch(error => {
        callback({
          isSuccess: false,
          value: 'Failed to save user information.',
        });
      });
  },

  updateUser: updateUser,

  getUser: getUser,

  deleteUser: (callback: Function) => {
    updateUser(
      getAuth().currentUser!.uid,
      { deleted: true },
      (response: { [name: string]: any }) => {
        if (response.isSuccess) {
          deleteUser(getAuth().currentUser!)
            .then(() => {
              callback({ isSuccess: true, value: 'User has been deleted.' });
            })
            .catch(error => {
              callback({
                isSuccess: false,
                value: 'Can not delete user at the moment.',
              });
            });
        } else {
          callback({
            isSuccess: false,
            value: 'Can not delete user at the moment.',
          });
        }
      },
    );
  },

  createPlayer: (
    playerId: string,
    data: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('players')
      .doc(playerId)
      .set(data)
      .then(() => {
        callback &&
          callback({ isSuccess: true, value: 'Created successfully!' });
      })
      .catch(error => {
        callback && callback({ isSuccess: false, value: 'Failed to create.' });
      });
  },

  updatePlayer: (
    playerId: string,
    data: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('players')
      .doc(playerId)
      .update(data)
      .then(() => {
        callback &&
          callback({ isSuccess: true, value: 'Updated successfully!' });
      })
      .catch(error => {
        callback && callback({ isSuccess: false, value: 'Failed to update.' });
      });
  },

  deletePlayerWithAssociatedData: (playerId: string, callback: Function) => {
    console.log('Starting comprehensive player deletion for:', playerId);
    
    // Get the player data first to access related information
    firestore()
      .collection('players')
      .doc(playerId)
      .get()
      .then(async (playerDoc) => {
        if (!playerDoc.exists()) {
          callback({ isSuccess: false, value: 'Player not found.' });
          return;
        }

        const playerData = playerDoc.data();
        const teamId = playerData?.teamId;
        
        console.log('Player data to process:', {
          teamId
        });

        try {
          // 1. Delete all player stats associated with this player
          console.log('Deleting player stats...');
          const playerStatsSnapshot = await firestore()
            .collection('playerStats')
            .where('playerId', '==', playerId)
            .get();
          
          const playerStatsDeletionPromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playerStatsDeletionPromises);
          console.log(`Deleted ${playerStatsSnapshot.size} player stats`);

          // 2. Delete all player average stats associated with this player
          console.log('Deleting player average stats...');
          const playerAverageStatsSnapshot = await firestore()
            .collection('playerAverageStats')
            .where('playerId', '==', playerId)
            .get();
          
          const playerAverageStatsDeletionPromises = playerAverageStatsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playerAverageStatsDeletionPromises);
          console.log(`Deleted ${playerAverageStatsSnapshot.size} player average stats`);

          // 3. Update matches to remove topScorePlayerId references
          console.log('Updating matches...');
          const matchesSnapshot = await firestore()
            .collection('matches')
            .where('topScorePlayerId', '==', playerId)
            .get();
          
          const matchUpdatePromises = matchesSnapshot.docs.map(doc => 
            doc.ref.update({ 
              topScorePlayerId: null,
              topScore: 0
            })
          );
          await Promise.all(matchUpdatePromises);
          console.log(`Updated ${matchesSnapshot.size} matches`);

          // 4. Finally, delete the player document itself
          console.log('Deleting player document...');
          await firestore().collection('players').doc(playerId).delete();
          console.log('Player document deleted');

          console.log('Player and all associated data deleted successfully!');
          callback({ 
            isSuccess: true, 
            value: 'Player and all associated data deleted successfully!' 
          });

        } catch (error) {
          console.error('Error during comprehensive player deletion:', error);
          callback({ 
            isSuccess: false, 
            value: 'Failed to delete player and associated data. Some data may have been partially deleted.' 
          });
        }
      })
      .catch(error => {
        console.error('Error fetching player for deletion:', error);
        callback({ isSuccess: false, value: 'Failed to load player for deletion.' });
      });
  },

  addPlayerStat: (
    playerStatId: string,
    data: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('playerStats')
      .doc(playerStatId)
      .set(data)
      .then(() => {
        callback && callback({ isSuccess: true, value: 'Add successfully!' });
      })
      .catch(error => {
        callback && callback({ isSuccess: false, value: 'Failed to add.' });
      });
  },

  updatePlayerStat: (
    playerStatId: string,
    data: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('playerStats')
      .doc(playerStatId)
      .update(data)
      .then(() => {
        callback &&
          callback({ isSuccess: true, value: 'Updated successfully!' });
      })
      .catch(error => {
        callback && callback({ isSuccess: false, value: 'Failed to update.' });
      });
  },

  // Function to calculate and update top scorer for a match
  updateMatchTopScorer: (matchId: string, callback?: Function) => {
    console.log('Calculating top scorer for match:', matchId);
    
    // First, get the match to find the league
    firestore()
      .collection('matches')
      .doc(matchId)
      .get()
      .then(async (matchDoc) => {
        if (!matchDoc.exists()) {
          callback && callback({ isSuccess: false, value: 'Match not found.' });
          return;
        }

        const matchData = matchDoc.data();
        const leagueId = matchData?.leagueId;

        if (!leagueId) {
          callback && callback({ isSuccess: false, value: 'Match missing league information.' });
          return;
        }

        try {
          // Query playerStats collection for this specific match to find top scorer
          const playerStatsSnapshot = await firestore()
            .collection('playerStats')
            .where('matchId', '==', matchId)
            .where('leagueId', '==', leagueId)
            .get();

          console.log(`Found ${playerStatsSnapshot.size} player stats for match ${matchId}`);

          // Find the player with the highest points in this match
          let topScorer: any = null;
          let topScore = 0;
          let topScorerPlayerId: string | null = null;

          playerStatsSnapshot.forEach(doc => {
            const statData = doc.data();
            const points = Number(statData.pointsPerGame || statData.points || 0);
            if (points > topScore) {
              topScore = points;
              topScorerPlayerId = statData.playerId;
            }
          });

          // If we found a top scorer, get player details
          if (topScorerPlayerId) {
            const playerDoc = await firestore()
              .collection('players')
              .doc(topScorerPlayerId)
              .get();

            if (playerDoc.exists()) {
              topScorer = { id: playerDoc.id, ...playerDoc.data() };
            }
          }

          // Update the match with top scorer information
          const matchUpdateData = {
            topScorePlayerId: topScorerPlayerId,
            topScore: topScore,
            lastUpdated: new Date().toISOString(),
          };

          await firestore()
            .collection('matches')
            .doc(matchId)
            .update(matchUpdateData);

          console.log('Match top scorer updated:', {
            matchId,
            topScorerId: topScorerPlayerId,
            topScorerName: topScorer?.name,
            topScore
          });

          callback && callback({ 
            isSuccess: true, 
            value: 'Top scorer updated successfully!',
            data: {
              topScorerId: topScorerPlayerId,
              topScorerName: topScorer?.name,
              topScore
            }
          });

        } catch (error) {
          console.error('Error calculating top scorer:', error);
          callback && callback({ isSuccess: false, value: 'Failed to calculate top scorer.' });
        }
      })
      .catch(error => {
        console.error('Error fetching match:', error);
        callback && callback({ isSuccess: false, value: 'Failed to fetch match.' });
      });
  },

  setTeam: setTeam,

  updateTeam: (
    teamId: string,
    data: { [name: string]: any },
    callback: Function,
  ) => {
    firestore()
      .collection('teams')
      .doc(teamId)
      .update(data)
      .then(() => {
        callback({ isSuccess: true, value: 'Updated successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to update.' });
      });
  },

  getTeam: (userId: string, callback: Function) => {
    firestore()
      .collection('teams')
      .where('coachId', '==', userId)
      .get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          const teamId = firestore().collection('teams').doc().id;
          const data = {
            id: teamId,
            coachId: userId,
          };
          setTeam(teamId, data, (response: { [name: string]: any }) => {
            if (response.isSuccess) {
              updateUser(userId, { teamId: teamId });
              callback({ isSuccess: true, value: data });
            } else {
              callback({ isSuccess: false, value: 'Failed to create team.' });
            }
          });
        } else {
          callback({ isSuccess: true, value: querySnapshot.docs[0].data() });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load team.' });
      });
  },

  setEvent: setEvent,

  updateEvent: (
    eventId: string,
    data: { [name: string]: any },
    callback: Function,
  ) => {
    firestore()
      .collection('events')
      .doc(eventId)
      .update(data)
      .then(() => {
        callback({ isSuccess: true, value: 'Updated successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to update.' });
      });
  },

  getEvents: (callback: Function) => {
    firestore()
      .collection('events')
      .get()
      .then(querySnapshot => {
        const items: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          items.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: items });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load events.' });
      });
  },

  getUpcomingEvents: (teamId: string, callback: Function) => {
    firestore()
      .collection('events')
      .where(
        Filter.and(
          Filter('teamId', '==', teamId),
          Filter('dateTime', '>=', Timestamp.fromDate(new Date())),
        ),
      )
      .get()
      .then(querySnapshot => {
        const items: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          items.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: items });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load events.' });
      });
  },

  createLeague: (
    leagueId: string,
    league: { [name: string]: any },
    callback: Function,
  ) => {
    firestore()
      .collection('league')
      .doc(leagueId)
      .set(league)
      .then(() => {
        callback({ isSuccess: true, value: 'Created league successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to save team.' });
      });
  },

  updateLeague: updateLeague,

  deleteLeague: (leagueId: string, callback: Function) => {
    firestore()
      .collection('league')
      .doc(leagueId)
      .delete()
      .then(() => {
        callback({ isSuccess: true, value: 'League deleted successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to delete league.' });
      });
  },

  deleteLeagueWithAssociatedData: (leagueId: string, callback: Function) => {
    console.log('Starting comprehensive league deletion for:', leagueId);
    
    // Get the league data first to access teamsId
    firestore()
      .collection('league')
      .doc(leagueId)
      .get()
      .then(async (leagueDoc) => {
        if (!leagueDoc.exists()) {
          callback({ isSuccess: false, value: 'League not found.' });
          return;
        }

        const leagueData = leagueDoc.data();
        const teamsId = leagueData?.teamsId || [];
        
        console.log('League teams to process:', teamsId);

        try {
          // 1. Delete all matches associated with this league
          console.log('Deleting matches...');
          const matchesSnapshot = await firestore()
            .collection('matches')
            .where('leagueId', '==', leagueId)
            .get();
          
          const matchDeletionPromises = matchesSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(matchDeletionPromises);
          console.log(`Deleted ${matchesSnapshot.size} matches`);

          // 2. Delete all player stats associated with this league
          console.log('Deleting player stats...');
          const playerStatsSnapshot = await firestore()
            .collection('playerStats')
            .where('leagueId', '==', leagueId)
            .get();
          
          const playerStatsDeletionPromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playerStatsDeletionPromises);
          console.log(`Deleted ${playerStatsSnapshot.size} player stats`);

          // 3. Delete all player average stats associated with this league
          console.log('Deleting player average stats...');
          const playerAverageStatsSnapshot = await firestore()
            .collection('playerAverageStats')
            .where('leagueId', '==', leagueId)
            .get();
          
          const playerAverageStatsDeletionPromises = playerAverageStatsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playerAverageStatsDeletionPromises);
          console.log(`Deleted ${playerAverageStatsSnapshot.size} player average stats`);

          // 4. Delete all events associated with teams in this league
          console.log('Deleting events...');
          if (teamsId.length > 0) {
            const eventsSnapshot = await firestore()
              .collection('events')
              .where('teamId', 'in', teamsId)
              .get();
            
            const eventsDeletionPromises = eventsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(eventsDeletionPromises);
            console.log(`Deleted ${eventsSnapshot.size} events`);
          }

          // 5. Delete all players associated with teams in this league
          console.log('Deleting players...');
          if (teamsId.length > 0) {
            const playersSnapshot = await firestore()
              .collection('players')
              .where('teamId', 'in', teamsId)
              .get();
            
            const playersDeletionPromises = playersSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(playersDeletionPromises);
            console.log(`Deleted ${playersSnapshot.size} players`);
          }

          // 6. Update teams to remove league references and league stats
          console.log('Updating teams...');
          if (teamsId.length > 0) {
            const teamUpdatePromises = teamsId.map(async (teamId: string) => {
              const teamDoc = await firestore().collection('teams').doc(teamId).get();
              if (teamDoc.exists()) {
                const teamData = teamDoc.data();
                const updatedLeaguesId = (teamData?.leaguesId || []).filter((id: string) => id !== leagueId);
                const updatedLeagueStats = { ...teamData?.leagueStats };
                delete updatedLeagueStats[leagueId];
                
                await firestore().collection('teams').doc(teamId).update({
                  leaguesId: updatedLeaguesId,
                  leagueStats: updatedLeagueStats
                });
              }
            });
            await Promise.all(teamUpdatePromises);
            console.log(`Updated ${teamsId.length} teams`);
          }

          // 7. Update users to remove league references
          console.log('Updating users...');
          const usersSnapshot = await firestore()
            .collection('users')
            .where('leagueId', '==', leagueId)
            .get();
          
          const userUpdatePromises = usersSnapshot.docs.map(doc => 
            doc.ref.update({ leagueId: null })
          );
          await Promise.all(userUpdatePromises);
          console.log(`Updated ${usersSnapshot.size} users`);

          // 8. Delete promo codes associated with this league (if any)
          console.log('Deleting promo codes...');
          const promoCodesSnapshot = await firestore()
            .collection('promoCodes')
            .get();
          
          const promoCodesToDelete = promoCodesSnapshot.docs.filter(doc => {
            const data = doc.data();
            // Check if promo code is related to this league (you might need to adjust this logic based on your promo code structure)
            return data.leagueId === leagueId;
          });
          
          const promoCodesDeletionPromises = promoCodesToDelete.map(doc => doc.ref.delete());
          await Promise.all(promoCodesDeletionPromises);
          console.log(`Deleted ${promoCodesToDelete.length} promo codes`);

          // 9. Finally, delete the league document itself
          console.log('Deleting league document...');
          await firestore().collection('league').doc(leagueId).delete();
          console.log('League document deleted');

          console.log('League and all associated data deleted successfully!');
          callback({ 
            isSuccess: true, 
            value: 'League and all associated data deleted successfully!' 
          });

        } catch (error) {
          console.error('Error during comprehensive league deletion:', error);
          callback({ 
            isSuccess: false, 
            value: 'Failed to delete league and associated data. Some data may have been partially deleted.' 
          });
        }
      })
      .catch(error => {
        console.error('Error fetching league for deletion:', error);
        callback({ isSuccess: false, value: 'Failed to load league for deletion.' });
      });
  },

  getLeagues: (callback: Function) => {
    firestore()
      .collection('league')
      .get()
      .then(querySnapshot => {
        const leagues: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          leagues.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: leagues });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load leagues.' });
      });
  },

  joinLeagues: (inviteId: string, teamId: string, callback: Function) => {
    firestore()
      .collection('league')
      .where('inviteId', '==', inviteId)
      .get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          callback({
            isSuccess: false,
            value: 'No league found with the invite code.',
          });
        } else {
          let joined = 0;
          let failed = 0;
          querySnapshot.forEach(documentSnapshot => {
            const league = documentSnapshot.data();
            let teamsId = league.teamsId ?? [];
            if (
              teamsId.indexOf(teamId) < 0 &&
              teamsId.length < league.maxTeamSize
            ) {
              teamsId = teamsId.concat(teamId);
              updateLeague(
                league.id,
                { teamsId: teamsId },
                (response: { [name: string]: any }) => {
                  if (response.isSuccess) {
                    joined++;
                  } else {
                    failed++;
                  }
                  if (joined + failed == querySnapshot.size) {
                    if (joined > 0) {
                      callback({
                        isSuccess: true,
                        value: `Joined ${joined} league${
                          joined >= 2 ? 's' : ''
                        } successfully!`,
                      });
                    } else {
                      callback({
                        isSuccess: false,
                        value: 'Failed to join league.',
                      });
                    }
                  }
                },
              );
            }
          });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to join league.' });
      });
  },

  getTeams: (teamsId: string[], callback: Function) => {
    if (teamsId.length === 0) {
      callback({ isSuccess: true, value: [] });
      return;
    }

    // Use Promise.all to fetch all teams in parallel
    const teamPromises = teamsId.map(teamId => 
      firestore()
        .collection('teams')
        .doc(teamId)
        .get()
        .then(doc => {
          if (doc.exists()) {
            return { id: doc.id, ...doc.data() };
          }
          return null;
        })
        .catch(error => {
          console.log('Error fetching team:', teamId, error);
          return null;
        })
    );

    Promise.all(teamPromises)
      .then(teams => {
        // Filter out null results (teams that don't exist or failed to fetch)
        const validTeams = teams.filter(team => team !== null);
        callback({ isSuccess: true, value: validTeams });
      })
      .catch(error => {
        console.log('Error fetching teams:', error);
        callback({ isSuccess: false, value: 'Failed to load teams.' });
      });
  },

  getTeamsByLeague: (leagueId: string, callback: Function) => {
    // First get the league to get its teamsId array
    firestore()
      .collection('league')
      .doc(leagueId)
      .get()
      .then(leagueDoc => {
        if (!leagueDoc.exists()) {
          callback({ isSuccess: false, value: 'League not found.' });
          return;
        }

        const leagueData = leagueDoc.data();
        const teamsId = leagueData?.teamsId || [];

        if (teamsId.length === 0) {
          callback({ isSuccess: true, value: [] });
          return;
        }

        // Fetch teams that belong to this specific league
        const teamPromises = teamsId.map((teamId: string) => 
          firestore()
            .collection('teams')
            .doc(teamId)
            .get()
            .then(doc => {
              if (doc.exists()) {
                const teamData = { id: doc.id, ...doc.data() };
                // Verify the team belongs to this league by checking if it's in the league's teamsId array
                if (teamsId.includes(doc.id)) {
                  return teamData;
                }
                return null;
              }
              return null;
            })
            .catch(error => {
              console.log('Error fetching team:', teamId, error);
              return null;
            })
        );

        Promise.all(teamPromises)
          .then(teams => {
            // Filter out null results and ensure teams are in the correct order
            const validTeams = teams.filter(team => team !== null);
            callback({ isSuccess: true, value: validTeams });
          })
          .catch(error => {
            console.log('Error fetching teams for league:', error);
            callback({ isSuccess: false, value: 'Failed to load teams for league.' });
          });
      })
      .catch(error => {
        console.log('Error fetching league:', error);
        callback({ isSuccess: false, value: 'Failed to load league.' });
      });
  },

  getMatchTeams: (match: { [name: string]: any }, callback: Function) => {
    // Get teams for a specific match, ensuring they belong to the match's league
    if (!match.leagueId || !match.teamAId || !match.teamBId) {
      callback({ isSuccess: false, value: 'Match data incomplete.' });
      return;
    }

    // First get the league to verify team membership
    firestore()
      .collection('league')
      .doc(match.leagueId)
      .get()
      .then(leagueDoc => {
        if (!leagueDoc.exists()) {
          callback({ isSuccess: false, value: 'League not found.' });
          return;
        }

        const leagueData = leagueDoc.data();
        const leagueTeamsId = leagueData?.teamsId || [];

        // Verify that both teams belong to this league
        if (!leagueTeamsId.includes(match.teamAId) || !leagueTeamsId.includes(match.teamBId)) {
          console.warn('Teams do not belong to the specified league:', {
            leagueId: match.leagueId,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            leagueTeamsId
          });
          callback({ isSuccess: false, value: 'Teams do not belong to the specified league.' });
          return;
        }

        // Fetch both teams
        const teamPromises = [match.teamAId, match.teamBId].map((teamId: string) => 
          firestore()
            .collection('teams')
            .doc(teamId)
            .get()
            .then(doc => {
              if (doc.exists()) {
                return { id: doc.id, ...doc.data() };
              }
              return null;
            })
            .catch(error => {
              console.log('Error fetching team:', teamId, error);
              return null;
            })
        );

        Promise.all(teamPromises)
          .then(teams => {
            const validTeams = teams.filter(team => team !== null);
            if (validTeams.length === 2) {
              callback({ isSuccess: true, value: validTeams });
            } else {
              callback({ isSuccess: false, value: 'Could not fetch both teams for the match.' });
            }
          })
          .catch(error => {
            console.log('Error fetching match teams:', error);
            callback({ isSuccess: false, value: 'Failed to load match teams.' });
          });
      })
      .catch(error => {
        console.log('Error fetching league for match teams:', error);
        callback({ isSuccess: false, value: 'Failed to load league for match teams.' });
      });
  },

  getMatches: (leagueId: string, callback: Function) => {
    firestore()
      .collection('matches')
      .where('leagueId', '==', leagueId)
      .get()
      .then(querySnapshot => {
        const matches: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          matches.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: matches });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load matches.' });
      });
  },

  getMatchesOfLeagues: (leagueIds: string[], callback: Function) => {
    // Firestore 'in' operator has a limit of 10 values
    const chunkSize = 10;
    const chunks = [];
    for (let i = 0; i < leagueIds.length; i += chunkSize) {
      chunks.push(leagueIds.slice(i, i + chunkSize));
    }
    
    // Execute all queries in parallel
    const promises = chunks.map(chunk => 
      firestore()
        .collection('matches')
        .where('leagueId', 'in', chunk)
        .get()
        .then(querySnapshot => {
          const matches: { [name: string]: any }[] = [];
          querySnapshot.forEach(documentSnapshot => {
            matches.push(documentSnapshot.data());
          });
          return matches;
        })
    );
    
    Promise.all(promises)
      .then(results => {
        // Flatten all results into a single array
        const allMatches = results.flat();
        callback({ isSuccess: true, value: allMatches });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load matches.' });
      });
  },

  getUpcomingMatchesOfLeagues: (leagueIds: string[], callback: Function) => {
    firestore()
      .collection('matches')
      .where(
        Filter.and(
          Filter('leagueId', 'in', leagueIds),
          Filter('dateTime', '>=', Timestamp.fromDate(new Date())),
        ),
      )
      .get()
      .then(querySnapshot => {
        const matches: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          matches.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: matches });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load matches.' });
      });
  },

  getPlayer: (playerId: string, callback: Function) => {
    firestore()
      .collection('players')
      .doc(playerId)
      .get()
      .then(documentSnapshot => {
        callback({ isSuccess: true, value: documentSnapshot.data() });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load player.' });
      });
  },

  getPlayers: (teamsId: string[], callback: Function) => {
    firestore()
      .collection('players')
      .where('teamId', 'in', teamsId)
      .get()
      .then(querySnapshot => {
        const players: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          if (!documentSnapshot.data().deleted) {
            players.push(documentSnapshot.data());
          }
        });
        callback({ isSuccess: true, value: players });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load players.' });
      });
  },

  getPlayerStats: (leagueId: string, callback: Function) => {
    firestore()
      .collection('playerStats')
      .where('leagueId', '==', leagueId)
      .get()
      .then(querySnapshot => {
        const playerStats: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          playerStats.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: playerStats });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load standings.' });
      });
  },

  getPromoCodes: (code: string, callback: Function) => {
    firestore()
      .collection('promoCodes')
      .where(Filter.and(Filter('code', '==', code), Filter('usedBy', '==', '')))
      .get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          callback({ isSuccess: false, value: 'Promo code does not exist.' });
        } else {
          const promoCodes: { [name: string]: any }[] = [];
          querySnapshot.forEach(documentSnapshot => {
            promoCodes.push(documentSnapshot.data());
          });
          callback({ isSuccess: true, value: promoCodes });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load promo codes.' });
      });
  },

  updatePromoCode: (
    id: string,
    data: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('promoCodes')
      .doc(id)
      .update(data)
      .then(() => {
        callback &&
          callback({ isSuccess: true, value: 'Updated successfully!' });
      })
      .catch(error => {
        callback && callback({ isSuccess: false, value: 'Failed to update.' });
      });
  },

  setMatch: (
    matchId: string,
    match: { [name: string]: any },
    callback: Function,
  ) => {
    firestore()
      .collection('matches')
      .doc(matchId)
      .set(match)
      .then(() => {
        callback({ isSuccess: true, value: 'Match created successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to create match.' });
      });
  },

  updateMatch: (
    matchId: string,
    updates: { [name: string]: any },
    callback?: Function,
  ) => {
    firestore()
      .collection('matches')
      .doc(matchId)
      .update(updates)
      .then(() => {
        callback &&
          callback({ isSuccess: true, value: 'Match updated successfully!' });
      })
      .catch(error => {
        callback &&
          callback({ isSuccess: false, value: 'Failed to update match.' });
      });
  },

  deleteMatch: (matchId: string, callback: Function) => {
    firestore()
      .collection('matches')
      .doc(matchId)
      .delete()
      .then(() => {
        callback({ isSuccess: true, value: 'Match deleted successfully!' });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to delete match.' });
      });
  },

  deleteMatchWithAssociatedData: (matchId: string, callback: Function) => {
    console.log('Starting comprehensive match deletion for:', matchId);
    
    // Get the match data first to access related information
    firestore()
      .collection('matches')
      .doc(matchId)
      .get()
      .then(async (matchDoc) => {
        if (!matchDoc.exists()) {
          callback({ isSuccess: false, value: 'Match not found.' });
          return;
        }

        const matchData = matchDoc.data();
        const leagueId = matchData?.leagueId;
        const teamAId = matchData?.teamAId;
        const teamBId = matchData?.teamBId;
        const topScorePlayerId = matchData?.topScorePlayerId;
        
        console.log('Match data to process:', {
          leagueId,
          teamAId,
          teamBId,
          topScorePlayerId
        });

        try {
          // 1. Delete all player stats associated with this match
          console.log('Deleting player stats...');
          const playerStatsSnapshot = await firestore()
            .collection('playerStats')
            .where('matchId', '==', matchId)
            .get();
          
          const playerStatsDeletionPromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playerStatsDeletionPromises);
          console.log(`Deleted ${playerStatsSnapshot.size} player stats`);

          // 2. Update player average stats for the league (decrease match count and recalculate averages)
          console.log('Updating player average stats...');
          if (leagueId) {
            const playerAverageStatsSnapshot = await firestore()
              .collection('playerAverageStats')
              .where('leagueId', '==', leagueId)
              .get();
            
            const playerAverageStatsUpdatePromises = playerAverageStatsSnapshot.docs.map(async (doc) => {
              const data = doc.data();
              const currentMatches = data.matches || 0;
              const newMatches = Math.max(0, currentMatches - 1);
              
              if (newMatches === 0) {
                // If no matches left, delete the player average stats document
                await doc.ref.delete();
              } else {
                // Recalculate averages (this is a simplified approach - in production you might want to recalculate from remaining player stats)
                const updatedData = {
                  ...data,
                  matches: newMatches,
                  // Note: In a real scenario, you'd want to recalculate these averages from remaining player stats
                  // For now, we'll keep the existing averages but reduce the match count
                };
                await doc.ref.update(updatedData);
              }
            });
            await Promise.all(playerAverageStatsUpdatePromises);
            console.log(`Updated ${playerAverageStatsSnapshot.size} player average stats`);
          }

          // 3. Update team league stats (decrease games count and update wins/losses)
          console.log('Updating team league stats...');
          if (leagueId && teamAId && teamBId) {
            const teamUpdatePromises = [teamAId, teamBId].map(async (teamId: string) => {
              const teamDoc = await firestore().collection('teams').doc(teamId).get();
              if (teamDoc.exists()) {
                const teamData = teamDoc.data();
                const leagueStats = teamData?.leagueStats || {};
                const currentLeagueStats = leagueStats[leagueId] || { games: 0, wins: 0, losses: 0 };
                
                // Decrease games count
                const newGames = Math.max(0, currentLeagueStats.games - 1);
                
                // Determine if this team won or lost (simplified logic)
                const teamAScore = matchData?.teamAScore || 0;
                const teamBScore = matchData?.teamBScore || 0;
                const isTeamA = teamId === teamAId;
                const teamWon = isTeamA ? teamAScore > teamBScore : teamBScore > teamAScore;
                
                // Update wins/losses
                let newWins = currentLeagueStats.wins;
                let newLosses = currentLeagueStats.losses;
                
                if (newGames > 0) {
                  if (teamWon) {
                    newWins = Math.max(0, newWins - 1);
                  } else {
                    newLosses = Math.max(0, newLosses - 1);
                  }
                } else {
                  newWins = 0;
                  newLosses = 0;
                }
                
                const updatedLeagueStats = {
                  ...leagueStats,
                  [leagueId]: {
                    games: newGames,
                    wins: newWins,
                    losses: newLosses
                  }
                };
                
                await firestore().collection('teams').doc(teamId).update({
                  leagueStats: updatedLeagueStats
                });
              }
            });
            await Promise.all(teamUpdatePromises);
            console.log(`Updated league stats for teams: ${teamAId}, ${teamBId}`);
          }

          // 4. Update player stats for the top scorer (if exists)
          console.log('Updating top scorer stats...');
          if (topScorePlayerId && leagueId) {
            const playerDoc = await firestore().collection('players').doc(topScorePlayerId).get();
            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              const stats = playerData?.stats || {};
              const leagueStats = stats[leagueId] || { matches: 0 };
              
              const newMatches = Math.max(0, leagueStats.matches - 1);
              
              const updatedStats = {
                ...stats,
                [leagueId]: {
                  ...leagueStats,
                  matches: newMatches
                }
              };
              
              await firestore().collection('players').doc(topScorePlayerId).update({
                stats: updatedStats
              });
              console.log(`Updated stats for top scorer: ${topScorePlayerId}`);
            }
          }

          // 5. Finally, delete the match document itself
          console.log('Deleting match document...');
          await firestore().collection('matches').doc(matchId).delete();
          console.log('Match document deleted');

          console.log('Match and all associated data deleted successfully!');
          callback({ 
            isSuccess: true, 
            value: 'Match and all associated data deleted successfully!' 
          });

        } catch (error) {
          console.error('Error during comprehensive match deletion:', error);
          callback({ 
            isSuccess: false, 
            value: 'Failed to delete match and associated data. Some data may have been partially deleted.' 
          });
        }
      })
      .catch(error => {
        console.error('Error fetching match for deletion:', error);
        callback({ isSuccess: false, value: 'Failed to load match for deletion.' });
      });
  },

  saveGameStats: saveGameStats,

  getTopPlayers: (limit: number = 10, callback: Function) => {
    firestore()
      .collection('playerAverageStats')
      .orderBy('averagePoints', 'desc')
      .limit(limit)
      .get()
      .then(querySnapshot => {
        const topPlayers: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          topPlayers.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: topPlayers });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load top players.' });
      });
  },

  getLeague: (leagueId: string, callback: Function) => {
    firestore()
      .collection('league')
      .doc(leagueId)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists()) {
          callback({ isSuccess: true, value: documentSnapshot.data() });
        } else {
          callback({ isSuccess: false, value: 'League not found.' });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load league.' });
      });
  },

  getAllLeagues: (callback: Function) => {
    firestore()
      .collection('league')
      .get()
      .then(querySnapshot => {
        const leagues: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          leagues.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: leagues });
      })
      .catch(error => {
        console.log('Error fetching leagues:', error);
        callback({ isSuccess: false, value: 'Failed to load leagues.' });
      });
  },


  getPlayerAverageStatsByLeague: (leagueId: string, callback: Function) => {
    firestore()
      .collection('playerAverageStats')
      .where('leagueId', '==', leagueId)
      .get()
      .then(querySnapshot => {
        const playerStats: { [name: string]: any }[] = [];
        querySnapshot.forEach(documentSnapshot => {
          playerStats.push(documentSnapshot.data());
        });
        callback({ isSuccess: true, value: playerStats });
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load player stats for league.' });
      });
  },

  // ✅ Get the latest match by league (always return topPlayerFromMatch = object or null)
  getLatestMatchByLeague: (leagueId: string, callback: Function) => {
    console.log('Fetching matches for leagueId:', leagueId);

    firestore()
      .collection('matches')
      .where('leagueId', '==', leagueId)
      .get()
      .then(async querySnapshot => {
        console.log(
          'Matches query result for leagueId',
          leagueId,
          ':',
          querySnapshot.size,
          'matches found'
        );

        if (querySnapshot.empty) {
          console.log('No matches found for leagueId:', leagueId);
          callback({ isSuccess: true, value: null });
          return;
        }

        // Get all matches
        const matches = querySnapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as any)
        );
        console.log('Matches data:', matches);

        // Sort matches by date to get the latest one
        const sortedMatches = matches.sort((a, b) => {
          // Prefer scheduled dateTime when available; otherwise fallback to lastUpdated
          const dateA = a?.dateTime?.toDate?.()
            ? a.dateTime.toDate()
            : (a?.lastUpdated ? new Date(a.lastUpdated) : new Date(0));
          const dateB = b?.dateTime?.toDate?.()
            ? b.dateTime.toDate()
            : (b?.lastUpdated ? new Date(b.lastUpdated) : new Date(0));
          return dateB.getTime() - dateA.getTime(); // Sort descending (latest first)
        });
        
        const latestMatch = sortedMatches[0];
        console.log('Latest match after sorting:', latestMatch);

        // Default: ensure we always attach topPlayerFromMatch
        let matchWithTopPlayer: any = { ...latestMatch, topPlayerFromMatch: null };

        if (latestMatch.topScorePlayerId) {
          console.log('Fetching top player details for match:', latestMatch.id, 'topScorePlayerId:', latestMatch.topScorePlayerId);

          try {
            const playerDoc = await firestore()
              .collection('players')
              .doc(latestMatch.topScorePlayerId)
              .get();

            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              console.log('Top player found:', playerData);
              console.log('Player data details:', {
                id: playerData?.id,
                name: playerData?.name,
                avatar: playerData?.avatar,
                teamId: playerData?.teamId
              });

              // Try fetching team details too
              let teamName = 'Unknown Team';
              if (playerData?.teamId) {
                const teamDoc = await firestore()
                  .collection('teams')
                  .doc(playerData.teamId)
                  .get();
                if (teamDoc.exists()) {
                  const teamData = teamDoc.data();
                  console.log('Top player team found:', teamData);
                  teamName = teamData?.name || 'Unknown Team';
                }
              }

              // Attach top player info
              matchWithTopPlayer.topPlayerFromMatch = {
                id: latestMatch.topScorePlayerId,
                name: playerData?.name || 'Unknown Player',
                avatar: playerData?.avatar || '',
                points: latestMatch.topScore || 0,
                teamName,
              };
              
              console.log('Created topPlayerFromMatch object:', matchWithTopPlayer.topPlayerFromMatch);
            }
          } catch (err) {
            console.log('Error fetching top player/team:', err);
            // keep topPlayerFromMatch = null
          }
        } else {
          console.log('No topScorePlayerId in match:', latestMatch.id);

          // If there is no topScorePlayerId (or lastUpdated is missing), compute top scorer from playerStats for this match
          // This ensures the UI can still show a top performer even without persisted fields
          try {
            if (latestMatch?.id && latestMatch?.leagueId) {
              const playerStatsSnapshot = await firestore()
                .collection('playerStats')
                .where('matchId', '==', latestMatch.id)
                .where('leagueId', '==', latestMatch.leagueId)
                .get();

              let topScore = 0;
              let topScorerPlayerId: string | null = null;

              playerStatsSnapshot.forEach(doc => {
                const statData = doc.data();
                const points = Number(statData.pointsPerGame || statData.points || 0);
                if (points > topScore) {
                  topScore = points;
                  topScorerPlayerId = statData.playerId;
                }
              });

              if (topScorerPlayerId) {
                const playerDoc = await firestore()
                  .collection('players')
                  .doc(topScorerPlayerId)
                  .get();

                let teamName = 'Unknown Team';
                let avatar = '';
                let name = 'Unknown Player';

                if (playerDoc.exists()) {
                  const playerData = playerDoc.data();
                  name = playerData?.name || name;
                  avatar = playerData?.avatar || avatar;
                  if (playerData?.teamId) {
                    const teamDoc = await firestore()
                      .collection('teams')
                      .doc(playerData.teamId)
                      .get();
                    if (teamDoc.exists()) {
                      const teamData = teamDoc.data();
                      teamName = teamData?.name || teamName;
                    }
                  }
                }

                matchWithTopPlayer.topPlayerFromMatch = {
                  id: topScorerPlayerId,
                  name,
                  avatar,
                  points: topScore,
                  teamName,
                };
              }
            }
          } catch (err) {
            console.log('Error computing top scorer from playerStats for match:', latestMatch.id, err);
          }
        }

        console.log('Returning match with topPlayerFromMatch:', matchWithTopPlayer);
        callback({ isSuccess: true, value: matchWithTopPlayer });
      })
      .catch(error => {
        console.log('Error fetching matches for leagueId', leagueId, ':', error);
        callback({ isSuccess: false, value: 'Failed to load latest match for league.' });
      });
  },

  // ✅ Get team by ID
  getTeamById: (teamId: string, callback: Function) => {
    firestore()
      .collection('teams')
      .doc(teamId)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists()) {
          callback({ isSuccess: true, value: documentSnapshot.data() });
        } else {
          callback({ isSuccess: false, value: 'Team not found.' });
        }
      })
      .catch(error => {
        console.log('Error fetching team:', error);
        callback({ isSuccess: false, value: 'Failed to load team.' });
      });
  },

  getPlayerWithTeam: (playerId: string, callback: Function) => {
    firestore()
      .collection('players')
      .doc(playerId)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists()) {
          const playerData = documentSnapshot.data();
          if (playerData?.teamId) {
            // Get team details
            firestore()
              .collection('teams')
              .doc(playerData.teamId)
              .get()
              .then(teamSnapshot => {
                if (teamSnapshot.exists()) {
                  const teamData = teamSnapshot.data();
                  callback({ 
                    isSuccess: true, 
                    value: { 
                      ...playerData, 
                      team: teamData 
                    } 
                  });
                } else {
                  callback({ 
                    isSuccess: true, 
                    value: { 
                      ...playerData, 
                      team: null 
                    } 
                  });
                }
              })
              .catch(error => {
                callback({ 
                  isSuccess: true, 
                  value: { 
                    ...playerData, 
                    team: null 
                  } 
                });
              });
          } else {
            callback({ 
              isSuccess: true, 
              value: { 
                ...playerData, 
                team: null 
              } 
            });
          }
        } else {
          callback({ isSuccess: false, value: 'Player not found.' });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load player.' });
      });
  },

  addTeamToLeague: (leagueId: string, teamId: string, callback: Function) => {
    // First get the current league data
    firestore()
      .collection('league')
      .doc(leagueId)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists()) {
          const leagueData = documentSnapshot.data();
          let teamsId = leagueData?.teamsId ?? [];
          
          // Check if team is already in the league
          if (teamsId.includes(teamId)) {
            callback({ isSuccess: false, value: 'Team is already in this league.' });
            return;
          }
          
          // Check if league is full
          if (teamsId.length >= leagueData?.maxTeamSize) {
            callback({ isSuccess: false, value: 'League is full. Cannot add more teams.' });
            return;
          }
          
          // Add team to league
          teamsId.push(teamId);
          
          firestore()
            .collection('league')
            .doc(leagueId)
            .update({ teamsId: teamsId })
            .then(() => {
              callback({ isSuccess: true, value: 'Team added to league successfully!' });
            })
            .catch(error => {
              callback({ isSuccess: false, value: 'Failed to add team to league.' });
            });
        } else {
          callback({ isSuccess: false, value: 'League not found.' });
        }
      })
      .catch(error => {
        callback({ isSuccess: false, value: 'Failed to load league.' });
      });
  },

  // Get all teams from the teams collection
  getAllTeams: (callback: Function) => {
    firestore()
      .collection('teams')
      .get()
      .then(querySnapshot => {
        const teams: any[] = [];
        querySnapshot.forEach(doc => {
          if (doc.exists()) {
            teams.push({ id: doc.id, ...doc.data() });
          }
        });
        callback({ isSuccess: true, value: teams });
      })
      .catch(error => {
        console.log('Error getting all teams:', error);
        callback({ isSuccess: false, value: 'Failed to load teams.' });
      });
  },

  // Get teams by coach ID
  getTeamsByCoach: (coachId: string, callback: Function) => {
    firestore()
      .collection('teams')
      .where('coachId', '==', coachId)
      .get()
      .then(querySnapshot => {
        const teams: any[] = [];
        querySnapshot.forEach(doc => {
          if (doc.exists()) {
            teams.push({ id: doc.id, ...doc.data() });
          }
        });
        callback({ isSuccess: true, value: teams });
      })
      .catch(error => {
        console.log('Error getting teams by coach:', error);
        callback({ isSuccess: false, value: 'Failed to load teams.' });
      });
  },

  // Delete team
  deleteTeam: (teamId: string, callback: Function) => {
    firestore()
      .collection('teams')
      .doc(teamId)
      .delete()
      .then(() => {
        callback({ isSuccess: true, value: 'Team deleted successfully!' });
      })
      .catch(error => {
        console.log('Error deleting team:', error);
        callback({ isSuccess: false, value: 'Failed to delete team.' });
      });
  },

  deleteTeamWithAssociatedData: (teamId: string, callback: Function) => {
    console.log('Starting comprehensive team deletion for:', teamId);
    
    // Get the team data first to access related information
    firestore()
      .collection('teams')
      .doc(teamId)
      .get()
      .then(async (teamDoc) => {
        if (!teamDoc.exists()) {
          callback({ isSuccess: false, value: 'Team not found.' });
          return;
        }

        const teamData = teamDoc.data();
        const leaguesId = teamData?.leaguesId || [];
        const coachId = teamData?.coachId;
        
        console.log('Team data to process:', {
          leaguesId,
          coachId
        });

        try {
          // 1. Delete all players associated with this team
          console.log('Deleting players...');
          const playersSnapshot = await firestore()
            .collection('players')
            .where('teamId', '==', teamId)
            .get();
          
          const playersDeletionPromises = playersSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(playersDeletionPromises);
          console.log(`Deleted ${playersSnapshot.size} players`);

          // 2. Delete all events associated with this team
          console.log('Deleting events...');
          const eventsSnapshot = await firestore()
            .collection('events')
            .where('teamId', '==', teamId)
            .get();
          
          const eventsDeletionPromises = eventsSnapshot.docs.map(doc => doc.ref.delete());
          await Promise.all(eventsDeletionPromises);
          console.log(`Deleted ${eventsSnapshot.size} events`);

          // 3. Delete all player stats associated with players from this team
          console.log('Deleting player stats...');
          if (playersSnapshot.size > 0) {
            const playerIds = playersSnapshot.docs.map(doc => doc.id);
            const playerStatsSnapshot = await firestore()
              .collection('playerStats')
              .where('playerId', 'in', playerIds)
              .get();
            
            const playerStatsDeletionPromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(playerStatsDeletionPromises);
            console.log(`Deleted ${playerStatsSnapshot.size} player stats`);
          }

          // 4. Delete all player average stats associated with players from this team
          console.log('Deleting player average stats...');
          if (playersSnapshot.size > 0) {
            const playerIds = playersSnapshot.docs.map(doc => doc.id);
            const playerAverageStatsSnapshot = await firestore()
              .collection('playerAverageStats')
              .where('playerId', 'in', playerIds)
              .get();
            
            const playerAverageStatsDeletionPromises = playerAverageStatsSnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(playerAverageStatsDeletionPromises);
            console.log(`Deleted ${playerAverageStatsSnapshot.size} player average stats`);
          }

          // 5. Update leagues to remove this team from their teamsId array
          console.log('Updating leagues...');
          if (leaguesId.length > 0) {
            const leagueUpdatePromises = leaguesId.map(async (leagueId: string) => {
              const leagueDoc = await firestore().collection('league').doc(leagueId).get();
              if (leagueDoc.exists()) {
                const leagueData = leagueDoc.data();
                const updatedTeamsId = (leagueData?.teamsId || []).filter((id: string) => id !== teamId);
                
                await firestore().collection('league').doc(leagueId).update({
                  teamsId: updatedTeamsId
                });
              }
            });
            await Promise.all(leagueUpdatePromises);
            console.log(`Updated ${leaguesId.length} leagues`);
          }

          // 6. Update matches to handle team removal (set teamAId or teamBId to null or delete matches)
          console.log('Updating matches...');
          const matchesSnapshot = await firestore()
            .collection('matches')
            .where('teamAId', '==', teamId)
            .get();
          
          const matchesBSnapshot = await firestore()
            .collection('matches')
            .where('teamBId', '==', teamId)
            .get();
          
          // Combine both queries
          const allMatches = [...matchesSnapshot.docs, ...matchesBSnapshot.docs];
          
          // Delete matches where this team was participating
          const matchDeletionPromises = allMatches.map(doc => doc.ref.delete());
          await Promise.all(matchDeletionPromises);
          console.log(`Deleted ${allMatches.length} matches`);

          // 7. Update users to remove team references
          console.log('Updating users...');
          if (coachId) {
            const userDoc = await firestore().collection('users').doc(coachId).get();
            if (userDoc.exists()) {
              await firestore().collection('users').doc(coachId).update({
                teamId: null
              });
              console.log(`Updated user: ${coachId}`);
            }
          }

          // 8. Finally, delete the team document itself
          console.log('Deleting team document...');
          await firestore().collection('teams').doc(teamId).delete();
          console.log('Team document deleted');

          console.log('Team and all associated data deleted successfully!');
          callback({ 
            isSuccess: true, 
            value: 'Team and all associated data deleted successfully!' 
          });

        } catch (error) {
          console.error('Error during comprehensive team deletion:', error);
          callback({ 
            isSuccess: false, 
            value: 'Failed to delete team and associated data. Some data may have been partially deleted.' 
          });
        }
      })
      .catch(error => {
        console.error('Error fetching team for deletion:', error);
        callback({ isSuccess: false, value: 'Failed to load team for deletion.' });
      });
  },
};
