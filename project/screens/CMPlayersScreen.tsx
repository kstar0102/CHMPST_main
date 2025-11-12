import React, {useState, useEffect, useRef, useCallback} from 'react'
import {SafeAreaView, FlatList, View} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ActionSheet from 'react-native-actionsheet'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMPlayerCell from '../components/CMPlayerCell'
import CMRipple from '../components/CMRipple'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMToast from '../components/CMToast'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import {useToast} from 'react-native-toast-notifications'

const CMPlayersScreen = ({navigation, route}: CMNavigationProps) => {
	const insets = useSafeAreaInsets()

	const themeMode = CMConstants.themeMode.light

	const [players, setPlayers] = useState(route.params.players)
	const [loading, setLoading] = useState(false)
	const toast = useToast()
	const team = route.params.team
	const actionSheetRef = useRef<any>(null)

	const loadPlayers = () => {
		CMFirebaseHelper.getPlayers([team.id], (response: {[name: string]: any}) => {
			if (response.isSuccess) {
				setPlayers(response.value)
			}
		})
	}

	const onEditPlayer = useCallback((player: {[name: string]: any}) => {
		navigation.navigate(CMConstants.screenName.editPlayer, {
			isEdit: true,
			team: team,
			player: player
		})
	}, [navigation, team])

	const onDeletePlayer = useCallback((player: {[name: string]: any}) => {
		CMAlertDlgHelper.showConfirmAlert(
			'Delete Player',
			`Are you sure you want to delete "${player.name}"? This will permanently delete the player and ALL associated data. This action cannot be undone.`,
			(confirmed: boolean) => {
				if (confirmed) {
					setLoading(true)
					CMFirebaseHelper.deletePlayerWithAssociatedData(player.id, (response: {[name: string]: any}) => {
						setLoading(false)
						if (response.isSuccess) {
							CMToast.makeText(toast, response.value)
							loadPlayers()
						} else {
							CMToast.makeText(toast, response.value)
						}
					})
				}
			}
		)
	}, [toast, team.id])

	const showActionSheet = useCallback(() => {
		actionSheetRef.current?.show()
	}, [])

	useEffect(() => {
		navigation.setOptions({
			title: team.name,
			headerRight: () => (
				<CMRipple
					containerStyle={{
						...CMCommonStyles.circle(CMConstants.height.iconBig),
						marginRight: CMConstants.space.normal,
						justifyContent: 'center',
						alignItems: 'center',
					}}
					onPress={showActionSheet}
				>
					<Ionicons
						name="add-outline"
						size={CMConstants.height.iconBig}
						color={CMConstants.color.black}
					/>
				</CMRipple>
			),
		})
	}, [team.name, showActionSheet])

	useEffect(() => {
		const unsubscribe = navigation.addListener('focus', () => {
			// Reload players when screen comes into focus (e.g., returning from add player screen)
			loadPlayers()
		})

		return unsubscribe
	}, [navigation, team.id])


	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog visible={loading} />
			<FlatList
				style={{flex: 0, marginHorizontal: CMConstants.space.small, marginTop: CMConstants.space.small, marginBottom: insets.bottom}}
				initialNumToRender={players.length}
				data={players}
				renderItem={({ item, separators }) => (
					<CMPlayerCell
						player={item}
						onPress={() => {
							navigation.navigate(CMConstants.screenName.playerDetails, {player: item})
						}}
						onEdit={() => onEditPlayer(item)}
						onDelete={() => onDeletePlayer(item)}
					/>
				)}
				ItemSeparatorComponent={({ highlighted }) => (
					<View style={{height: CMConstants.space.smallEx}} />
				)}
			/>
			<ActionSheet
				ref={actionSheetRef}
				title={''}
				options={['Add Player', 'Add Player Stats', 'Cancel']}
				cancelButtonIndex={2}
				destructiveButtonIndex={2}
				onPress={(index: number) => {
					if (index === 0) {
						// Add Player
						navigation.navigate(CMConstants.screenName.editPlayer, {
							isEdit: false,
							team: team,
							player: {}
						})
					} else if (index === 1) {
						// Add Player Stats
						navigation.navigate(CMConstants.screenName.editPlayerStats, {
							playerStat: {},
							team: team,
							players: players
						})
					}
				}}
			/>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMPlayersScreen