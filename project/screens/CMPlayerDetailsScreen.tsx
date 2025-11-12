import React, {useState, useEffect} from 'react'
import {SafeAreaView, View, ViewStyle, Text, ScrollView, TextStyle} from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {useToast} from 'react-native-toast-notifications'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils';
import CMProfileImage from '../components/CMProfileImage';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';

const CMPlayerDetailsScreen = ({navigation, route}: CMNavigationProps) => {
	const insets = useSafeAreaInsets()
	const toast = useToast()

	const themeMode = CMConstants.themeMode.light
	const Tab = createMaterialTopTabNavigator()

	const player = route.params.player

	const [team, setTeam] = useState<{ [name: string]: any }>({});
	const [lastThreeGames, setLastThreeGames] = useState<{ [name: string]: any }[]>([]);
	const [seasonStats, setSeasonStats] = useState<{ [name: string]: any }>({});
	const [gameMatches, setGameMatches] = useState<{ [matchId: string]: { match: any, teamA: any, teamB: any } }>({});

	useEffect(() => {
		navigation.setOptions({title: 'Player Details'})
		
		// Load team
		if (player.teamId) {
			CMFirebaseHelper.getTeams(
				[player.teamId],
				(response: { [name: string]: any }) => {
					if (response.isSuccess && response.value.length > 0) {
						const loadedTeam = response.value[0] || {};
						setTeam(loadedTeam);
					}
				},
			);
		}

		// Load last 3 games stats
		if (player.id) {
			CMFirebaseHelper.getLastThreeGamesStats(
				player.id,
				(response: { [name: string]: any }) => {
					if (response.isSuccess) {
						const games = response.value || [];
						setLastThreeGames(games);
						
						// Load match data for each game
						games.forEach((game: { [name: string]: any }) => {
							if (game.matchId) {
								// Load match
								CMFirebaseHelper.getMatch(
									game.matchId,
									(matchResponse: { [name: string]: any }) => {
										if (matchResponse.isSuccess) {
											const match = matchResponse.value;
											const matchData: { match: any, teamA: any, teamB: any } = {
												match: match,
												teamA: {},
												teamB: {},
											};
											
											// Load teams
											if (match.teamAId && match.teamBId) {
												CMFirebaseHelper.getTeams(
													[match.teamAId, match.teamBId],
													(teamsResponse: { [name: string]: any }) => {
														if (teamsResponse.isSuccess) {
															matchData.teamA = teamsResponse.value[0] || {};
															matchData.teamB = teamsResponse.value[1] || {};
														}
														setGameMatches((prev) => ({
															...prev,
															[game.matchId]: matchData,
														}));
													},
												);
											} else {
												setGameMatches((prev) => ({
													...prev,
													[game.matchId]: matchData,
												}));
											}
										}
									},
								);
							}
						});
					}
				},
			);

			// Load season stats
			CMFirebaseHelper.getPlayerSeasonStats(
				player.id,
				(response: { [name: string]: any }) => {
					if (response.isSuccess) {
						setSeasonStats(response.value || {});
					}
				},
			);
		}
	}, [player])

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<View style={{...CMCommonStyles.body, flex: 1, marginBottom: insets.bottom}}>
				<View
					style={styles.shortInfo}
				>
					<CMProfileImage
						radius={80}
						imgURL={player.avatar}
					/>
					<View
						style={{marginLeft: CMConstants.space.smallEx}}
					>
						<Text
							style={CMCommonStyles.title(themeMode)}
							numberOfLines={1}
						>
							{player.name}
						</Text>
					</View>
				</View>
				<View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.label(themeMode)}>Birthday</Text>
						<Text style={styles.label(themeMode)}>Height</Text>
						<Text style={styles.label(themeMode)}>Weight</Text>
					</View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.value(themeMode)}>
						{player.birthDate ? CMUtils.strSimpleDate(player.birthDate.toDate()) : 'N/A'}
					</Text>
						<Text style={styles.value(themeMode)}>{player.height}</Text>
						<Text style={styles.value(themeMode)}>{player.weight}</Text>
					</View>
				</View>
				<View style={{marginTop: CMConstants.space.smallEx}}>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.label(themeMode)}>Jersey number</Text>
						<Text style={styles.label(themeMode)}>Points per game</Text>
						<Text style={styles.label(themeMode)}>Position</Text>
					</View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.value(themeMode)}>{player.number || 'N/A'}</Text>
						<Text style={styles.value(themeMode)}>
							{seasonStats.pointsPerGame || '-'}
						</Text>
						<Text style={styles.value(themeMode)}>{player.position || 'N/A'}</Text>
					</View>
				</View>
				<View style={{marginTop: CMConstants.space.smallEx}}>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.label(themeMode)}>Team</Text>
					</View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.value(themeMode)}>{team.name || 'N/A'}</Text>
					</View>
				</View>
				<View style={styles.divider} />
				<ScrollView
					style={{flex: 1}}
					nestedScrollEnabled={true}
				>
					{/* Last Three Games Stats */}
					<Text style={styles.sectionTitle(themeMode)}>Last three games stats</Text>
					<View style={styles.divider} />
					{lastThreeGames.length > 0 ? (
						<View>
							{lastThreeGames.map((game: { [name: string]: any }, index: number) => {
								const matchData = game.matchId ? gameMatches[game.matchId] : null;
								const teamA = matchData?.teamA || {};
								const teamB = matchData?.teamB || {};
								const matchName = matchData 
									? `${teamA.name || 'Team A'} vs ${teamB.name || 'Team B'}`
									: `Game ${index + 1}`;
								
								return (
								<View key={game.id || index} style={styles.gameStatRow}>
									<View style={styles.gameStatHeader}>
										<Text style={styles.gameStatLabel(themeMode)} numberOfLines={2}>
											{matchName}
										</Text>
										{game.dayTime && (
											<Text style={styles.gameStatDate(themeMode)}>
												{CMUtils.strSimpleDate(game.dayTime.toDate())}
											</Text>
										)}
									</View>
									<View style={styles.statsGrid}>
										<View style={styles.statItem}>
											<Text style={styles.statLabel(themeMode)}>P</Text>
											<Text style={styles.statValue(themeMode)}>
												{game.pointsPerGame || game.points || 0}
											</Text>
										</View>
										<View style={styles.statItem}>
											<Text style={styles.statLabel(themeMode)}>A</Text>
											<Text style={styles.statValue(themeMode)}>
												{game.assists || 0}
											</Text>
										</View>
										<View style={styles.statItem}>
											<Text style={styles.statLabel(themeMode)}>R</Text>
											<Text style={styles.statValue(themeMode)}>
												{game.rebounds || 0}
											</Text>
										</View>
										<View style={styles.statItem}>
											<Text style={styles.statLabel(themeMode)}>B</Text>
											<Text style={styles.statValue(themeMode)}>
												{game.blocks || 0}
											</Text>
										</View>
										<View style={styles.statItem}>
											<Text style={styles.statLabel(themeMode)}>S</Text>
											<Text style={styles.statValue(themeMode)}>
												{game.steals || 0}
											</Text>
										</View>
									</View>
								</View>
								);
							})}
						</View>
					) : (
						<Text style={styles.noDataText(themeMode)}>
							No game statistics available.
						</Text>
					)}

					{/* Season Stats */}
					<Text style={styles.sectionTitle(themeMode)}>Season Stats</Text>
					<View style={styles.divider} />
					{seasonStats.gamesPlayed > 0 ? (
						<View>
							<View style={styles.statsGrid}>
								<View style={styles.statItem}>
									<Text style={styles.statLabel(themeMode)}>P</Text>
									<Text style={styles.statValue(themeMode)}>
										{seasonStats.points || 0}
									</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statLabel(themeMode)}>A</Text>
									<Text style={styles.statValue(themeMode)}>
										{seasonStats.assists || 0}
									</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statLabel(themeMode)}>R</Text>
									<Text style={styles.statValue(themeMode)}>
										{seasonStats.rebounds || 0}
									</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statLabel(themeMode)}>B</Text>
									<Text style={styles.statValue(themeMode)}>
										{seasonStats.blocks || 0}
									</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statLabel(themeMode)}>S</Text>
									<Text style={styles.statValue(themeMode)}>
										{seasonStats.steals || 0}
									</Text>
								</View>
							</View>
							<View style={styles.seasonSummary}>
								<View style={styles.summaryGrid}>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryLabel(themeMode)}>GAMES PLAYED</Text>
										<Text style={styles.summaryValue(themeMode)}>
											{seasonStats.gamesPlayed || 0}
										</Text>
									</View>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryLabel(themeMode)}>PPG</Text>
										<Text style={styles.summaryValue(themeMode)}>
											{seasonStats.pointsPerGame || '0.0'}
										</Text>
									</View>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryLabel(themeMode)}>APG</Text>
										<Text style={styles.summaryValue(themeMode)}>
											{seasonStats.assistsPerGame || '0.0'}
										</Text>
									</View>
									<View style={styles.summaryCard}>
										<Text style={styles.summaryLabel(themeMode)}>RPG</Text>
										<Text style={styles.summaryValue(themeMode)}>
											{seasonStats.reboundsPerGame || '0.0'}
										</Text>
									</View>
								</View>
							</View>
						</View>
					) : (
						<Text style={styles.noDataText(themeMode)}>
							No season statistics available.
						</Text>
					)}
				</ScrollView>
			</View>
		</SafeAreaView>
	)
}

const styles = {
	shortInfo: {
		padding: CMConstants.space.small,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		overflow: 'hidden',
	} as ViewStyle,
	label: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		flex: 1,
	}),
	value: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textNormalSemiBold(themeMode),
		flex: 1,
	}),
	divider: {
		height: 1,
		backgroundColor: CMConstants.color.lightGrey,
		marginVertical: CMConstants.space.small,
	} as ViewStyle,
	sectionTitle: (themeMode: string): TextStyle => ({
		...CMCommonStyles.label(themeMode),
		marginTop: CMConstants.space.normal,
		marginBottom: CMConstants.space.smallEx,
	}),
	gameStatRow: {
		marginBottom: CMConstants.space.normal,
		paddingBottom: CMConstants.space.small,
		borderBottomWidth: 1,
		borderBottomColor: CMConstants.color.lightGrey,
	} as ViewStyle,
	gameStatHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: CMConstants.space.smallEx,
	} as ViewStyle,
	gameStatLabel: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmallBold(themeMode),
	}),
	gameStatDate: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		color: CMConstants.color.grey,
	}),
	statsGrid: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: CMConstants.space.smallEx,
	} as ViewStyle,
	statItem: {
		alignItems: 'center',
		minWidth: 50,
	} as ViewStyle,
	statLabel: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		fontWeight: 'bold',
		marginBottom: CMConstants.space.smallEx / 2,
	}),
	statValue: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textNormalSemiBold(themeMode),
	}),
	seasonSummary: {
		marginTop: CMConstants.space.normal,
		paddingTop: CMConstants.space.normal,
		borderTopWidth: 1,
		borderTopColor: CMConstants.color.lightGrey,
	} as ViewStyle,
	summaryGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	} as ViewStyle,
	summaryCard: {
		backgroundColor: CMConstants.color.lightGrey2,
		borderRadius: CMConstants.radius.normal,
		padding: CMConstants.space.normal,
		alignItems: 'center',
		justifyContent: 'center',
		width: '48%',
		marginBottom: CMConstants.space.small,
		minHeight: 100,
	} as ViewStyle,
	summaryLabel: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		color: CMConstants.color.grey,
		marginBottom: CMConstants.space.smallEx,
		letterSpacing: 0.5,
	}),
	summaryValue: (themeMode: string): TextStyle => ({
		...CMCommonStyles.title(themeMode),
		fontSize: 24,
		fontWeight: 'bold',
	}),
	noDataText: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		color: CMConstants.color.grey,
		marginTop: CMConstants.space.small,
		textAlign: 'center',
	}),
};

export default CMPlayerDetailsScreen