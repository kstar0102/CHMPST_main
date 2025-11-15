import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CMGlobal from '../CMGlobal';
import CMAlertDlgHelper from './CMAlertDlgHelper';

/**
 * Check if the current user can edit a league
 * @param leagueId - The league ID to check
 * @param league - Optional league object (if already loaded)
 * @returns Promise<boolean> - true if user can edit, false otherwise
 */
export const canEditLeague = async (
  leagueId: string,
  league?: { [name: string]: any }
): Promise<boolean> => {
  const currentUser = getAuth().currentUser;
  if (!currentUser || !CMGlobal.user) {
    return false;
  }

  // Admin can edit everything
  if (CMGlobal.user.role === 'admin') {
    return true;
  }

  // For coaches, check if they are the admin of this league
  let leagueData = league;
  if (!leagueData) {
    try {
      const leagueDoc = await firestore().collection('league').doc(leagueId).get();
      if (!leagueDoc.exists()) {
        return false;
      }
      leagueData = { id: leagueDoc.id, ...leagueDoc.data() };
    } catch (error) {
      console.log('Error fetching league:', error);
      return false;
    }
  }

  // Coach can only edit if they are the admin of the league
  return leagueData?.adminId === currentUser.uid;
};

/**
 * Check if the current user can edit a team
 * @param teamId - The team ID to check
 * @param team - Optional team object (if already loaded)
 * @returns Promise<boolean> - true if user can edit, false otherwise
 */
export const canEditTeam = async (
  teamId: string,
  team?: { [name: string]: any }
): Promise<boolean> => {
  const currentUser = getAuth().currentUser;
  if (!currentUser || !CMGlobal.user) {
    return false;
  }

  // Admin can edit everything
  if (CMGlobal.user.role === 'admin') {
    return true;
  }

  // For coaches, check if the team belongs to a league they admin
  let teamData = team;
  if (!teamData) {
    try {
      const teamDoc = await firestore().collection('teams').doc(teamId).get();
      if (!teamDoc.exists()) {
        return false;
      }
      teamData = { id: teamDoc.id, ...teamDoc.data() };
    } catch (error) {
      console.log('Error fetching team:', error);
      return false;
    }
  }

  // Check if team belongs to any league where user is admin
  try {
    const leaguesSnapshot = await firestore()
      .collection('league')
      .where('adminId', '==', currentUser.uid)
      .get();

    if (leaguesSnapshot.empty) {
      return false;
    }

    // Check if team is in any of the user's leagues
    for (const leagueDoc of leaguesSnapshot.docs) {
      const leagueData = leagueDoc.data();
      const teamsId = leagueData.teamsId || [];
      if (teamsId.includes(teamId)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.log('Error checking team permissions:', error);
    return false;
  }
};

/**
 * Check if the current user can edit a player
 * @param playerId - The player ID to check
 * @param player - Optional player object (if already loaded)
 * @returns Promise<boolean> - true if user can edit, false otherwise
 */
export const canEditPlayer = async (
  playerId: string,
  player?: { [name: string]: any }
): Promise<boolean> => {
  const currentUser = getAuth().currentUser;
  if (!currentUser || !CMGlobal.user) {
    return false;
  }

  // Admin can edit everything
  if (CMGlobal.user.role === 'admin') {
    return true;
  }

  // For coaches, check if the player's team belongs to a league they admin
  let playerData = player;
  if (!playerData) {
    try {
      const playerDoc = await firestore().collection('players').doc(playerId).get();
      if (!playerDoc.exists()) {
        return false;
      }
      playerData = { id: playerDoc.id, ...playerDoc.data() };
    } catch (error) {
      console.log('Error fetching player:', error);
      return false;
    }
  }

  const teamId = playerData?.teamId;
  if (!teamId) {
    return false;
  }

  // Check if player's team belongs to any league where user is admin
  return await canEditTeam(teamId);
};

/**
 * Check if the current user can edit a match
 * @param matchId - The match ID to check
 * @param match - Optional match object (if already loaded)
 * @returns Promise<boolean> - true if user can edit, false otherwise
 */
export const canEditMatch = async (
  matchId: string,
  match?: { [name: string]: any }
): Promise<boolean> => {
  const currentUser = getAuth().currentUser;
  if (!currentUser || !CMGlobal.user) {
    return false;
  }

  // Admin can edit everything
  if (CMGlobal.user.role === 'admin') {
    return true;
  }

  // For coaches, check if the match belongs to a league they admin
  let matchData = match;
  if (!matchData) {
    try {
      const matchDoc = await firestore().collection('matches').doc(matchId).get();
      if (!matchDoc.exists()) {
        return false;
      }
      matchData = { id: matchDoc.id, ...matchDoc.data() };
    } catch (error) {
      console.log('Error fetching match:', error);
      return false;
    }
  }

  const leagueId = matchData?.leagueId;
  if (!leagueId) {
    return false;
  }

  // Check if match's league is admin'd by user
  return await canEditLeague(leagueId);
};

/**
 * Show permission denied alert and optionally navigate back
 * @param navigation - Optional navigation object to go back
 */
export const showPermissionDenied = (navigation?: any) => {
  CMAlertDlgHelper.showAlertWithOK(
    'Permission Denied\n\nYou do not have permission to edit this item. You can only edit items in leagues you created.',
    () => {
      if (navigation) {
        navigation.goBack();
      }
    }
  );
};

export default {
  canEditLeague,
  canEditTeam,
  canEditPlayer,
  canEditMatch,
  showPermissionDenied,
};

