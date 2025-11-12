import React, {useEffect, useMemo, useState, useCallback} from 'react'
import {SafeAreaView, View, Text} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMRipple from '../components/CMRipple'
import {ScrollView, TextInput} from 'react-native-gesture-handler'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import firestore from '@react-native-firebase/firestore'

// Screen to manage per-player stats for a given match
// route.params: { match: Match, leagueId: string, teamAPlayers: Player[], teamBPlayers: Player[] }

const CMMatchPlayersStatsScreen = ({navigation, route}: CMNavigationProps) => {
  const insets = useSafeAreaInsets()
  const themeMode = CMConstants.themeMode.light

  const match = route.params.match
  const leagueId = route.params.leagueId || match.leagueId

  const [loading, setLoading] = useState(false)
  const [teamA, setTeamA] = useState<any | null>(null)
  const [teamB, setTeamB] = useState<any | null>(null)
  const [playersTeamA, setPlayersTeamA] = useState<any[]>([])
  const [playersTeamB, setPlayersTeamB] = useState<any[]>([])
  const [statByPlayerId, setStatByPlayerId] = useState<Record<string, {points: string; rebounds: string; assists: string; steals: string; blocks: string; turnovers: string}>>({})

  useEffect(() => {
    navigation.setOptions({title: 'Match Player Stats'})

    // Load both teams' players if not provided
    if (route.params?.teamAPlayers && route.params?.teamBPlayers) {
      setPlayersTeamA(route.params.teamAPlayers)
      setPlayersTeamB(route.params.teamBPlayers)
      initStats([...route.params.teamAPlayers, ...route.params.teamBPlayers])
    } else {
      setLoading(true)
      CMFirebaseHelper.getTeams([match.teamAId, match.teamBId], (respTeams: any) => {
        if (respTeams.isSuccess) {
          const ta = respTeams.value.find((t: any) => t.id === match.teamAId) || null
          const tb = respTeams.value.find((t: any) => t.id === match.teamBId) || null
          setTeamA(ta)
          setTeamB(tb)
          const teamIds = respTeams.value.map((t: any) => t.id)
          CMFirebaseHelper.getPlayers(teamIds, (respPlayers: any) => {
            setLoading(false)
            if (respPlayers.isSuccess) {
              const a = respPlayers.value.filter((p: any) => p.teamId === match.teamAId)
              const b = respPlayers.value.filter((p: any) => p.teamId === match.teamBId)
              setPlayersTeamA(a)
              setPlayersTeamB(b)
              initStats([...a, ...b])
              // Prefill stats for current match & league only and choose the most recent per player
              firestore()
                .collection('playerStats')
                .where('leagueId', '==', leagueId)
                .where('matchId', '==', match.id)
                .get()
                .then(snapshot => {
                  if (!snapshot.empty) {
                    // Build latest-by-player map
                    const latestByPlayer: Record<string, any> = {}
                    snapshot.forEach(doc => {
                      const d: any = doc.data()
                      const pid = d.playerId
                      const existing = latestByPlayer[pid]
                      const deterministicId = `${match.id}_${pid}`
                      const ts = d.dayTime?.toDate?.() ? d.dayTime.toDate() : new Date(d.dayTime || 0)
                      const existingTs = existing?.dayTime?.toDate?.() ? existing.dayTime.toDate() : new Date(existing?.dayTime || 0)

                      const preferThis = doc.id === deterministicId || !existing || ts > existingTs
                      if (preferThis) latestByPlayer[pid] = { ...d, id: doc.id }
                    })

                    setStatByPlayerId(prev => {
                      const copy = { ...prev }
                      Object.values(latestByPlayer).forEach((s: any) => {
                        copy[s.playerId] = {
                          points: String(s.pointsPerGame ?? ''),
                          rebounds: String(s.rebounds ?? ''),
                          assists: String(s.assists ?? ''),
                          steals: String(s.steals ?? ''),
                          blocks: String(s.blocks ?? ''),
                          turnovers: String(s.turnovers ?? ''),
                        }
                      })
                      return copy
                    })
                  }
                })
                .catch(() => {})
            }
          })
        } else {
          setLoading(false)
        }
      })
    }
  }, [])

  const initStats = (playersList: any[]) => {
    const map: Record<string, any> = {}
    playersList.forEach(p => {
      map[p.id] = {points: '', rebounds: '', assists: '', steals: '', blocks: '', turnovers: ''}
    })
    setStatByPlayerId(map)
  }

  const setField = useCallback((playerId: string, field: string, value: string) => {
    setStatByPlayerId(prev => ({...prev, [playerId]: {...prev[playerId], [field]: value}}))
  }, [])

  const onSaveAll = async () => {
    setLoading(true)
    try {
      const ops: Promise<any>[] = []
      const affectedPlayerIds: Set<string> = new Set()
      ;[...playersTeamA, ...playersTeamB].forEach(p => {
        const s = statByPlayerId[p.id]
        if (!s) return
        affectedPlayerIds.add(p.id)
        const payload = {
          playerId: p.id,
          leagueId: leagueId,
          matchId: match.id,
          dayTime: new Date(),
          pointsPerGame: parseFloat(s.points || '0'),
          assists: parseFloat(s.assists || '0'),
          rebounds: parseFloat(s.rebounds || '0'),
          turnovers: parseFloat(s.turnovers || '0'),
          steals: parseFloat(s.steals || '0'),
          blocks: parseFloat(s.blocks || '0'),
        }
        // Use a deterministic document id per (match, player) so edits overwrite instead of creating duplicates
        const id = `${match.id}_${p.id}`
        ops.push(new Promise(resolve => {
          CMFirebaseHelper.addPlayerStat(id, {...payload, id}, () => resolve(null))
        }))
      })

      await Promise.all(ops)

      // Update top scorer for this match - await the update to ensure it completes before navigating
      await new Promise<void>((resolve) => {
        CMFirebaseHelper.updateMatchTopScorer(match.id, (response: {[name: string]: any}) => {
          if (response.isSuccess) {
            console.log('Top scorer updated for match after stats save:', response.data);
          } else {
            console.log('Failed to update top scorer after stats save:', response.value);
          }
          resolve();
        });
      });

      // Recompute averages for affected players
      const recomputeOps: Promise<any>[] = []
      affectedPlayerIds.forEach(playerId => {
        recomputeOps.push(
          firestore()
            .collection('playerStats')
            .where('leagueId', '==', leagueId)
            .where('playerId', '==', playerId)
            .get()
            .then(snapshot => {
              let totalPts = 0, totalReb = 0, totalAst = 0, totalStl = 0, totalBlk = 0, totalTov = 0, count = 0
              snapshot.forEach(doc => {
                const d: any = doc.data()
                totalPts += Number(d.pointsPerGame || 0)
                totalReb += Number(d.rebounds || 0)
                totalAst += Number(d.assists || 0)
                totalStl += Number(d.steals || 0)
                totalBlk += Number(d.blocks || 0)
                totalTov += Number(d.turnovers || 0)
                count += 1
              })
              const avg = (n: number) => (count === 0 ? 0 : n / count)
              const avgDocId = `${leagueId}${playerId}`
              return firestore().collection('playerAverageStats').doc(avgDocId).set({
                id: avgDocId,
                leagueId,
                playerId,
                matches: count,
                averagePoints: avg(totalPts),
                averageRebounds: avg(totalReb),
                averageAssists: avg(totalAst),
                averageSteals: avg(totalStl),
                averageBlocks: avg(totalBlk),
                averageTurnovers: avg(totalTov),
              }, { merge: true })
            })
        )
      })

      await Promise.all(recomputeOps)
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const renderRow = (item: any) => {
    const s = statByPlayerId[item.id] || {}
    return (
      <View style={{padding: CMConstants.space.smallEx, backgroundColor: CMConstants.color.lightGrey1, borderRadius: CMConstants.radius.normal}}>
        <Text style={CMCommonStyles.title(themeMode)}>{item.name}</Text>
        <View style={{flexDirection: 'row', marginTop: CMConstants.space.smallEx}}>
          <StatInput label="PTS" value={s.points} onChange={v => setField(item.id, 'points', v)} />
          <StatInput label="REB" value={s.rebounds} onChange={v => setField(item.id, 'rebounds', v)} />
          <StatInput label="AST" value={s.assists} onChange={v => setField(item.id, 'assists', v)} />
        </View>
        <View style={{flexDirection: 'row', marginTop: CMConstants.space.smallEx}}>
          <StatInput label="STL" value={s.steals} onChange={v => setField(item.id, 'steals', v)} />
          <StatInput label="BLK" value={s.blocks} onChange={v => setField(item.id, 'blocks', v)} />
          <StatInput label="TOV" value={s.turnovers} onChange={v => setField(item.id, 'turnovers', v)} />
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <CMLoadingDialog visible={loading} />
      <ScrollView style={{flex: 1, margin: CMConstants.space.small}}
        contentContainerStyle={{paddingBottom: CMConstants.space.large}}
        keyboardShouldPersistTaps={'handled'}
      >
        <Text style={[CMCommonStyles.title(themeMode), {marginBottom: CMConstants.space.smallEx}]}>{teamA?.name || 'Team A'}</Text>
        {playersTeamA.length === 0 ? (
          <Text style={CMCommonStyles.textNormal(themeMode)}>No players</Text>
        ) : (
          playersTeamA.map((p, idx) => (
            <View key={p.id} style={{marginBottom: CMConstants.space.smallEx}}>
              {renderRow(p)}
            </View>
          ))
        )}
        <View style={{height: CMConstants.space.normal}} />
        <Text style={[CMCommonStyles.title(themeMode), {marginBottom: CMConstants.space.smallEx}]}>{teamB?.name || 'Team B'}</Text>
        {playersTeamB.length === 0 ? (
          <Text style={CMCommonStyles.textNormal(themeMode)}>No players</Text>
        ) : (
          playersTeamB.map((p, idx) => (
            <View key={p.id} style={{marginBottom: CMConstants.space.smallEx}}>
              {renderRow(p)}
            </View>
          ))
        )}
      </ScrollView>
      <CMRipple
        containerStyle={{...CMCommonStyles.buttonMain, position: 'absolute', left: CMConstants.space.small, right: CMConstants.space.small, bottom: insets.bottom + CMConstants.space.small}}
        onPress={onSaveAll}
      >
        <Text style={CMCommonStyles.buttonMainText}>Save Stats</Text>
      </CMRipple>
    </SafeAreaView>
  )
}

const StatInput = ({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) => {
  return (
    <View style={{flex: 1, marginRight: CMConstants.space.smallEx}}>
      <Text style={{color: CMConstants.color.darkGrey, marginBottom: 4}}>{label}</Text>
      <TextInput
        style={{...CMCommonStyles.textInput(CMConstants.themeMode.light), height: CMConstants.height.textInput}}
        defaultValue={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={CMConstants.color.grey}
        returnKeyType="done"
        underlineColorAndroid="#f000"
      />
    </View>
  )
}

export default CMMatchPlayersStatsScreen

