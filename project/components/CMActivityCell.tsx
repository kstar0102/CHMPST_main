import React, { useState, useEffect } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMConstants from '../CMConstants';
import CMRipple from './CMRipple';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMImageView from './CMImageView';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import CMUtils from '../utils/CMUtils';
import CMProfileImage from './CMProfileImage';

const CMActivityCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { activity = {} } = props

	const [teamA, setTeamA] = useState<{[name: string]: any}>({})
	const [teamB, setTeamB] = useState<{[name: string]: any}>({})
	const [topScorePlayer, setTopScorePlayer] = useState<{[name: string]: any}>()
	const [league, setLeague] = useState<{[name: string]: any}>({})

	useEffect(() => {
		if (activity.type == CMConstants.activityType.match) {
			const match = activity.data
			// Use the new league-scoped team fetching method to prevent data mixing
			CMFirebaseHelper.getMatchTeams(match, (response: {[name: string]: any}) => {
				if (response.isSuccess) {
					setTeamA(response.value[0])
					setTeamB(response.value[1])
				} else {
					console.warn('Failed to fetch match teams:', response.value);
					// Fallback to old method if new method fails
					CMFirebaseHelper.getTeams([match.teamAId, match.teamBId], (fallbackResponse: {[name: string]: any}) => {
						if (fallbackResponse.isSuccess) {
							setTeamA(fallbackResponse.value[0])
							setTeamB(fallbackResponse.value[1])
						}
					})
				}
			})

			if (match.topScorePlayerId) {
				CMFirebaseHelper.getPlayer(match.topScorePlayerId, (response: {[name: string]: any}) => {
					if (response.isSuccess) {
						setTopScorePlayer(response.value)
					}
				})
			}

			// Fetch league data to get the league logo
			if (match.leagueId) {
				CMFirebaseHelper.getLeague(match.leagueId, (response: {[name: string]: any}) => {
					if (response.isSuccess) {
						setLeague(response.value)
					}
				})
			}
		}
	}, [])

	const getDisplayImage = () => {
		// If match has an image, use it
		if (activity?.data?.image) {
			return activity.data.image;
		}
		// Otherwise, use league logo as default for matches
		if (activity.type == CMConstants.activityType.match && league.avatar) {
			return league.avatar;
		}
		// Return null if no image available
		return null;
	};

  return (
    <CMRipple
      containerStyle={styles.cell}
      onPress={() => {
        console.log('CMActivityCell onPress called');
        console.log('Activity type:', activity.type);
        console.log('Activity data:', activity.data);
        if (props.onPress) {
          props.onPress();
        } else {
          console.error('onPress function is not defined in CMActivityCell!');
        }
      }}
    >{console.log('league===========================', JSON.stringify(activity?.data))}
      <CMImageView style={styles.matchImage} imgURL={getDisplayImage()} />
      <View style={styles.content}>
        <View style={styles.categoryHeader}>
          {activity.type == CMConstants.activityType.match && league.avatar && (
            <CMProfileImage 
              radius={24} 
              imgURL={league.avatar} 
              style={styles.leagueLogo}
            />
          )}
          <View style={styles.category}>
            <Text
              style={{ ...CMCommonStyles.textSmallEx(themeMode) }}
              numberOfLines={1}
            >
              {activity.type == CMConstants.activityType.event
                ? 'Event'
                : 'League Match'}
            </Text>
          </View>
        </View>
        <Text
          style={{
            ...CMCommonStyles.title(themeMode),
            textAlign: 'center',
            marginVertical: CMConstants.space.small,
          }}
          numberOfLines={2}
        >
          {activity?.data?.name ?? '-'}
        </Text>
        {activity.type == CMConstants.activityType.match && (
          <View style={styles.matchResult}>
            <View
              style={styles.teamName(
                activity?.data?.teamAScore ?? 0,
                activity?.data?.teamBScore ?? 0,
              )}
            >
              <Text
                style={{
                  ...CMCommonStyles.label(themeMode),
                  textAlign: 'center',
                }}
              >
                {teamA?.name ?? '-'}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={styles.score}>
                <Text
                  style={{
                    ...CMCommonStyles.textSmall(themeMode),
                    textAlign: 'center',
                    color: CMConstants.color.white,
                  }}
                  numberOfLines={1}
                >
                  {`${activity?.data?.teamAScore ?? 0} : ${
                    activity?.data?.teamBScore ?? 0
                  }`}
                </Text>
              </View>
            </View>
            <View
              style={styles.teamName(
                activity?.data?.teamBScore ?? 0,
                activity?.data?.teamAScore ?? 0,
              )}
            >
              <Text
                style={{
                  ...CMCommonStyles.label(themeMode),
                  textAlign: 'center',
                }}
              >
                {teamB?.name ?? '-'}
              </Text>
            </View>
          </View>
        )}
        {topScorePlayer && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <CMProfileImage radius={40} imgURL={topScorePlayer.avatar} />
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: CMConstants.space.smallEx,
              }}
            >
              <Text
                style={CMCommonStyles.textSmallBold(themeMode)}
                numberOfLines={1}
              >
                {topScorePlayer.name}
              </Text>
              <Text
                style={{
                  ...CMCommonStyles.textSmallBold(themeMode),
                  marginLeft: CMConstants.space.small,
                }}
                numberOfLines={1}
              >
                {activity?.data?.topScore ?? 0}
              </Text>
              <Text
                style={CMCommonStyles.textSmallEx(themeMode)}
                numberOfLines={1}
              >
                {' '}
                Points Scored
              </Text>
            </View>
          </View>
        )}
        <View style={styles.properties}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Ionicons
                name={'time-outline'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
              <Text
                style={{
                  ...CMCommonStyles.textSmall(themeMode),
                  marginLeft: 4,
                }}
                numberOfLines={1}
              >
                {activity?.data?.dateTime
                  ? CMUtils.strTimeFromDate(activity.data.dateTime.toDate())
                      : '-/-/-'}
              </Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Ionicons
                name={'calendar-outline'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
              <Text
                style={{
                  ...CMCommonStyles.textSmall(themeMode),
                  marginLeft: 4,
                }}
                numberOfLines={1}
              >
                {activity?.data?.dateTime
                  ? CMUtils.strDateFromDate(activity?.data?.dateTime?.toDate())
                      : '-/-/-'}
              </Text>
            </View>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Ionicons
                name={'location-outline'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
              <Text
                style={{
                  ...CMCommonStyles.textSmall(themeMode),
                  marginLeft: 4,
                }}
                numberOfLines={1}
              >
                {activity?.data?.location ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </CMRipple>
  );
};

const styles = {
  cell: {
    backgroundColor: CMConstants.color.lightGrey2,
    borderWidth: 1,
    borderRadius: CMConstants.radius.normal,
    borderColor: CMConstants.color.lightGrey,
    overflow: 'hidden',
  },
  matchImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    marginHorizontal: CMConstants.space.smallEx,
    marginBottom: CMConstants.space.small,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: CMConstants.space.smallEx,
  } as ViewStyle,
  category: {
    backgroundColor: CMConstants.color.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 15,
    alignSelf: 'flex-start',alignItems: 'center',
  } as ViewStyle,
  leagueLogo: {
    marginRight: 8,
  } as ViewStyle,
  matchResult: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  teamName: (teamAScore: number, teamBScore: number): ViewStyle => ({
    flex: 1,
    padding: CMConstants.space.smallEx,
    borderRadius: CMConstants.radius.normal,
    backgroundColor:
      teamAScore > teamBScore
        ? CMConstants.color.lightGrey
        : CMConstants.color.lightGrey1,
  }),
  score: {
    backgroundColor: CMConstants.color.darkGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  properties: {
    flex: 1,
    marginTop: CMConstants.space.small,
  } as ViewStyle,
};

export default CMActivityCell;
