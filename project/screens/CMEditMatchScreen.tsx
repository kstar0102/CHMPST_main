import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, Keyboard, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMRipple from '../components/CMRipple';
import CMConstants from '../CMConstants';
import CMLoadingDialog from '../dialog/CMLoadingDialog';
import { TextInput } from 'react-native-gesture-handler';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper';
import CMUtils from '../utils/CMUtils';
import { getAuth } from '@react-native-firebase/auth';
import CMGlobal from '../CMGlobal';
import CMDropDownPicker from '../components/CMDropDownPicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CMImagePicker from '../helper/CMImagePicker';
import CMImageView from '../components/CMImageView';
import CMProfileImage from '../components/CMProfileImage';

const CMEditMatchScreen = ({ navigation, route }: CMNavigationProps) => {
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(route.params.match?.name ?? '');
  // Date/Time (separate inputs with strict formatting)
  const initialDate: any = route.params.match?.dateTime;
  const initialJsDate: Date = initialDate?.toDate?.() || (initialDate instanceof Date ? initialDate : undefined) || new Date();
  const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
  const initDateText = `${initialJsDate.getFullYear()}-${pad2(initialJsDate.getMonth() + 1)}-${pad2(initialJsDate.getDate())}`;
  const initTimeText = `${pad2(initialJsDate.getHours())}:${pad2(initialJsDate.getMinutes())}`;
  const [dateText, setDateText] = useState(initDateText);
  const [timeText, setTimeText] = useState(initTimeText);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState(route.params.match?.location ?? '');
  const [teamAScore, setTeamAScore] = useState(
    route.params.match?.teamAScore != null ? String(route.params.match?.teamAScore) : ''
  );
  const [teamBScore, setTeamBScore] = useState(
    route.params.match?.teamBScore != null ? String(route.params.match?.teamBScore) : ''
  );
  const [topScore, setTopScore] = useState(
    route.params.match?.topScore != null ? String(route.params.match?.topScore) : ''
  );
  const [topScorePlayerId, setTopScorePlayerId] = useState(route.params.match?.topScorePlayerId ?? '');
  const [status, setStatus] = useState(
    route.params.match?.status ?? CMConstants.gameStatus.notStarted,
  );
  const [selectedLeague, setSelectedLeague] = useState(
    route.params.match?.leagueId ?? '',
  );
  const [selectedTeamA, setSelectedTeamA] = useState(
    route.params.match?.teamAId ?? '',
  );
  const [selectedTeamB, setSelectedTeamB] = useState(
    route.params.match?.teamBId ?? '',
  );

  const [leagues, setLeagues] = useState<{ [name: string]: any }[]>([]);
  const [teams, setTeams] = useState<{ [name: string]: any }[]>([]);
  const [leagueOpen, setLeagueOpen] = useState(false);
  const [teamAOpen, setTeamAOpen] = useState(false);
  const [teamBOpen, setTeamBOpen] = useState(false);
  
  // Image and league data states
  const [matchImage, setMatchImage] = useState(route.params.match?.image ?? null);
  const [selectedLeagueData, setSelectedLeagueData] = useState<{ [name: string]: any }>({});

  const themeMode = CMConstants.themeMode.light;

  useEffect(() => {
    if (!route.params.isEdit) {
      navigation.setOptions({ title: 'Create Match' });
    }

    // Header button to open Match Player Stats (only when editing an existing match)
    if (route.params.isEdit && route.params.match?.id) {
      navigation.setOptions({
        headerRight: () => (
          <CMRipple
            containerStyle={{ ...CMCommonStyles.circle(CMConstants.height.iconBig), marginRight: CMConstants.space.normal, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              navigation.navigate(CMConstants.screenName.matchPlayersStats, {
                match: route.params.match,
                leagueId: route.params.match.leagueId,
              })
            }}
          >
            <Ionicons name={'stats-chart-outline'} size={CMConstants.height.icon} color={CMConstants.color.black} />
          </CMRipple>
        ),
      })
    } else {
      navigation.setOptions({ headerRight: undefined })
    }

    // Load user's leagues
      CMFirebaseHelper.getLeagues(
        (response: { [name: string]: any }) => {
          if (response.isSuccess) {
            setLeagues(response.value);
          }
        },
      );
    
  }, [route.params?.isEdit, route.params?.match?.id]);

  useEffect(() => {
    // Load teams when league is selected
    if (selectedLeague) {
      const league = leagues.find(l => l.id === selectedLeague);
      if (league && league.teamsId) {
        setSelectedLeagueData(league);
        CMFirebaseHelper.getTeams(
          league.teamsId,
          (response: { [name: string]: any }) => {
            if (response.isSuccess) {
              setTeams(response.value);
            }
          },
        );
      }
    }
  }, [selectedLeague, leagues]);

  const handleImagePicker = (index: number) => {
    CMImagePicker.showImagePicker(
      index,
      (success: boolean, result: any) => {
        if (success) {
          setMatchImage(result.path);
        } else {
          console.log('Image picker cancelled or failed:', result);
        }
      },
      { width: 400, height: 400 },
      true
    );
  };

  const getDisplayImage = () => {
    // If user has uploaded an image, use it
    if (matchImage) {
      return matchImage;
    }
    // Otherwise, use league logo as default
    return selectedLeagueData.avatar || null;
  };

  const onBtnCreateMatch = () => {
    if (name.trim().length === 0) {
      CMAlertDlgHelper.showAlertWithOK('Please enter match name.');
      return;
    }
    if (!selectedLeague) {
      CMAlertDlgHelper.showAlertWithOK('Please select a league.');
      return;
    }
    if (!selectedTeamA || !selectedTeamB) {
      CMAlertDlgHelper.showAlertWithOK('Please select both teams.');
      return;
    }
    if (selectedTeamA === selectedTeamB) {
      CMAlertDlgHelper.showAlertWithOK('Please select different teams.');
      return;
    }
    // Optional validations
    if (teamAScore && isNaN(Number(teamAScore))) {
      CMAlertDlgHelper.showAlertWithOK('Team A score must be a number.');
      return;
    }
    if (teamBScore && isNaN(Number(teamBScore))) {
      CMAlertDlgHelper.showAlertWithOK('Team B score must be a number.');
      return;
    }
    if (topScore && isNaN(Number(topScore))) {
      CMAlertDlgHelper.showAlertWithOK('Top score must be a number.');
      return;
    }

    // Validate date and time
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    const timeRegex = /^\d{2}:\d{2}$/; // HH:mm (24h)
    if (!dateRegex.test(dateText)) {
      CMAlertDlgHelper.showAlertWithOK('Please enter date as YYYY-MM-DD.');
      return;
    }
    if (!timeRegex.test(timeText)) {
      CMAlertDlgHelper.showAlertWithOK('Please enter time as HH:mm (24-hour).');
      return;
    }

    const combinedDate = new Date(`${dateText}T${timeText}:00`);
    if (isNaN(combinedDate.getTime())) {
      CMAlertDlgHelper.showAlertWithOK('Invalid date/time. Please check the values.');
      return;
    }

    const matchId = route.params.isEdit ? route.params.match.id : CMFirebaseHelper.getNewDocumentId('matches');
    const matchData = {
      id: matchId,
      name: name.trim(),
      dateTime: combinedDate,
      location: location?.trim?.() ?? '',
      status: status,
      leagueId: selectedLeague,
      teamAId: selectedTeamA,
      teamBId: selectedTeamB,
      teamAScore: teamAScore === '' ? 0 : Number(teamAScore),
      teamBScore: teamBScore === '' ? 0 : Number(teamBScore),
      topScore: topScore === '' ? 0 : Number(topScore),
      topScorePlayerId: topScorePlayerId ?? '',
      image: matchImage, // Include the uploaded image or null
      createdBy: route.params.isEdit ? route.params.match.createdBy : getAuth().currentUser?.uid || '',
      createdAt: route.params.isEdit ? route.params.match.createdAt : new Date(),
      updatedAt: new Date(),
    };

    setLoading(true);
    CMFirebaseHelper.setMatch(
      matchId,
      matchData,
      (response: { [name: string]: any }) => {
        setLoading(false);
        if (response.isSuccess) {
          const successMessage = route.params.isEdit ? 'Match updated successfully!' : 'Match created successfully!';
          CMAlertDlgHelper.showAlertWithOK(successMessage, () => {
            if (route.params.callback) {
              route.params.callback();
            }
            navigation.pop();
          });
        } else {
          CMAlertDlgHelper.showAlertWithOK(response.value);
        }
      },
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case CMConstants.gameStatus.notStarted:
        return 'Not Started';
      case CMConstants.gameStatus.inProgress:
        return 'In Progress';
      case CMConstants.gameStatus.finished:
        return 'Finished';
      case CMConstants.gameStatus.paused:
        return 'Paused';
      default:
        return 'Not Started';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case CMConstants.gameStatus.notStarted:
        return CMConstants.color.grey;
      case CMConstants.gameStatus.inProgress:
        return CMConstants.color.denim;
      case CMConstants.gameStatus.finished:
        return CMConstants.color.fireBrick;
      case CMConstants.gameStatus.paused:
        return CMConstants.color.semiDarkGrey;
      default:
        return CMConstants.color.grey;
    }
  };

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <CMLoadingDialog visible={loading} />
      <KeyboardAwareScrollView
        style={{ marginBottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={CMCommonStyles.body}
      >
        <View>
         

          {/* Match Image */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Match Image</Text>
          </View>
          <View style={{ marginTop: 4, alignItems: 'center' }}>
            <CMImageView 
              style={{ 
                width: 200, 
                height: 120, 
                borderRadius: CMConstants.radius.normal,
                backgroundColor: CMConstants.color.lightGrey2
              }} 
              imgURL={getDisplayImage()} 
            />
            <View style={{ 
              flexDirection: 'row', 
              marginTop: CMConstants.space.small,
              gap: CMConstants.space.small 
            }}>
              <CMRipple
                containerStyle={{ 
                  ...CMCommonStyles.buttonSecond, 
                  paddingHorizontal: CMConstants.space.small,
                  paddingVertical: CMConstants.space.smallEx
                }}
                onPress={() => handleImagePicker(0)}
              >
                <Text style={CMCommonStyles.buttonSecondText}>Camera</Text>
              </CMRipple>
              <CMRipple
                containerStyle={{ 
                  ...CMCommonStyles.buttonSecond, 
                  paddingHorizontal: CMConstants.space.small,
                  paddingVertical: CMConstants.space.smallEx
                }}
                onPress={() => handleImagePicker(1)}
              >
                <Text style={CMCommonStyles.buttonSecondText}>Gallery</Text>
              </CMRipple>
              {matchImage && (
                <CMRipple
                  containerStyle={{ 
                    ...CMCommonStyles.buttonSecond, 
                    paddingHorizontal: CMConstants.space.small,
                    paddingVertical: CMConstants.space.smallEx,
                    backgroundColor: CMConstants.color.fireBrick
                  }}
                  onPress={() => setMatchImage(null)}
                >
                  <Text style={{...CMCommonStyles.buttonSecondText, color: CMConstants.color.white}}>Remove</Text>
                </CMRipple>
              )}
            </View>
           
          </View>

 <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Match Name</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            defaultValue={name}
            onChangeText={text => setName(text)}
            placeholder="e.g., Team A vs Team B"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />
          {/* Location */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Location</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            defaultValue={location}
            onChangeText={text => setLocation(text)}
            placeholder="e.g., Wilson Arena"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />

          {/* Date */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Date (YYYY-MM-DD)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TextInput
              style={[CMCommonStyles.textInput(themeMode), { flex: 1 }]}
              defaultValue={dateText}
              onChangeText={text => setDateText(text)}
              placeholder="e.g., 2025-08-28"
              placeholderTextColor={CMConstants.color.grey}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="#f000"
              submitBehavior="submit"
            />
            <CMRipple
              containerStyle={{ ...CMCommonStyles.circle(CMConstants.height.iconBig), marginLeft: CMConstants.space.smallEx, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name={'calendar-outline'} size={CMConstants.height.icon} color={CMConstants.color.black} />
            </CMRipple>
          </View>
          {showDatePicker && (
            <Modal
              transparent
              animationType="fade"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: CMConstants.color.white, borderRadius: CMConstants.radius.normal, padding: CMConstants.space.normal, width: '90%' }}>
                  <Text style={[CMCommonStyles.title(themeMode), { marginBottom: CMConstants.space.small }]}>Select Date</Text>
                  <DateTimePicker
                    value={initialJsDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="light"
                    {...(Platform.OS === 'ios' ? { textColor: CMConstants.color.black } : {})}
                    onChange={(event: any, selectedDate?: Date) => {
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                      if (selectedDate) {
                        const newDate = `${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`;
                        setDateText(newDate);
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: CMConstants.space.small }}>
                      <CMRipple
                        containerStyle={{ ...CMCommonStyles.buttonSecond, paddingHorizontal: CMConstants.space.small }}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={CMCommonStyles.buttonSecondText}>Done</Text>
                      </CMRipple>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          )}

          {/* Time */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Time (HH:mm)</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TextInput
              style={[CMCommonStyles.textInput(themeMode), { flex: 1 }]}
              defaultValue={timeText}
              onChangeText={text => setTimeText(text)}
              placeholder="e.g., 14:30"
              keyboardType="numeric"
              placeholderTextColor={CMConstants.color.grey}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              underlineColorAndroid="#f000"
              submitBehavior="submit"
            />
            <CMRipple
              containerStyle={{ ...CMCommonStyles.circle(CMConstants.height.iconBig), marginLeft: CMConstants.space.smallEx, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name={'time-outline'} size={CMConstants.height.icon} color={CMConstants.color.black} />
            </CMRipple>
          </View>
          {showTimePicker && (
            <Modal
              transparent
              animationType="fade"
              visible={showTimePicker}
              onRequestClose={() => setShowTimePicker(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: CMConstants.color.white, borderRadius: CMConstants.radius.normal, padding: CMConstants.space.normal, width: '90%' }}>
                  <Text style={[CMCommonStyles.title(themeMode), { marginBottom: CMConstants.space.small }]}>Select Time</Text>
                  <DateTimePicker
                    value={initialJsDate}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant="light"
                    {...(Platform.OS === 'ios' ? { textColor: CMConstants.color.black } : {})}
                    onChange={(event: any, selectedDate?: Date) => {
                      if (Platform.OS !== 'ios') setShowTimePicker(false);
                      if (selectedDate) {
                        const newTime = `${pad2(selectedDate.getHours())}:${pad2(selectedDate.getMinutes())}`;
                        setTimeText(newTime);
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: CMConstants.space.small }}>
                      <CMRipple
                        containerStyle={{ ...CMCommonStyles.buttonSecond, paddingHorizontal: CMConstants.space.small }}
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={CMCommonStyles.buttonSecondText}>Done</Text>
                      </CMRipple>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          )}

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>League</Text>
          </View>
          <CMDropDownPicker
            isOpened={leagueOpen}
            themeMode={themeMode}
            defaultStyle={CMCommonStyles.dropDownStyle}
            defaultDropDownContainerStyle={
              CMCommonStyles.dropDownContainerStyle
            }
            placeholder="Select League"
            open={leagueOpen}
            value={selectedLeague}
            items={leagues.map(league => ({
              label: league.name,
              value: league.id,
            }))}
            setOpen={setLeagueOpen}
            onSelectItem={(item: any) => {
              setSelectedLeague(item.value);
              setSelectedTeamA('');
              setSelectedTeamB('');
            }}
            setItems={setLeagues}
            onOpen={() => {
              setTeamAOpen(false);
              setTeamBOpen(false);
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>
              Home Team (Team A)
            </Text>
          </View>
          <CMDropDownPicker
            isOpened={teamAOpen}
            themeMode={themeMode}
            defaultStyle={CMCommonStyles.dropDownStyle}
            defaultDropDownContainerStyle={
              CMCommonStyles.dropDownContainerStyle
            }
            placeholder="Select Home Team"
            open={teamAOpen}
            value={selectedTeamA}
            items={teams.map(team => ({
              label: team.name || `Team ${team.id}`,
              value: team.id,
            }))}
            setOpen={setTeamAOpen}
            onSelectItem={(item: any) => setSelectedTeamA(item.value)}
            setItems={setTeams}
            onOpen={() => {
              setLeagueOpen(false);
              setTeamBOpen(false);
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>
              Away Team (Team B)
            </Text>
          </View>
          <CMDropDownPicker
            isOpened={teamBOpen}
            themeMode={themeMode}
            defaultStyle={CMCommonStyles.dropDownStyle}
            defaultDropDownContainerStyle={
              CMCommonStyles.dropDownContainerStyle
            }
            placeholder="Select Away Team"
            open={teamBOpen}
            value={selectedTeamB}
            items={teams.map(team => ({
              label: team.name || `Team ${team.id}`,
              value: team.id,
            }))}
            setOpen={setTeamBOpen}
            onSelectItem={(item: any) => setSelectedTeamB(item.value)}
            setItems={setTeams}
            onOpen={() => {
              setLeagueOpen(false);
              setTeamAOpen(false);
            }}
          />
          {/* Scores and Top Scorer */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Team A Score</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            defaultValue={teamAScore}
            onChangeText={text => setTeamAScore(text)}
            placeholder="e.g., 0"
            keyboardType="numeric"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Team B Score</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            defaultValue={teamBScore}
            onChangeText={text => setTeamBScore(text)}
            placeholder="e.g., 0"
            keyboardType="numeric"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Top Score</Text>
          </View>
          <TextInput
            style={[CMCommonStyles.textInput(themeMode), { marginTop: 4 }]}
            defaultValue={topScore}
            onChangeText={text => setTopScore(text)}
            placeholder="e.g., 21"
            keyboardType="numeric"
            placeholderTextColor={CMConstants.color.grey}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            underlineColorAndroid="#f000"
            submitBehavior="submit"
          />

         

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
            <Text style={CMCommonStyles.label(themeMode)}>Status</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 4,
              gap: 10,
            }}
          >
            {CMConstants.gameStatus &&
              Object.values(CMConstants.gameStatus).map(statusValue => (
                <CMRipple
                  key={statusValue}
                  containerStyle={{
                    ...CMCommonStyles.buttonSecond,
                    backgroundColor:
                      status === statusValue
                        ? getStatusColor(statusValue)
                        : CMCommonStyles.buttonSecond.backgroundColor,
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                  }}
                  onPress={() => setStatus(statusValue)}
                >
                  <Text
                    style={{
                      ...CMCommonStyles.buttonSecondText,
                      color:
                        status === statusValue
                          ? CMConstants.color.white
                          : CMCommonStyles.buttonSecondText.color,
                    }}
                  >
                    {getStatusLabel(statusValue)}
                  </Text>
                </CMRipple>
              ))}
          </View>

          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.normal,
            }}
          >
            <CMRipple
              containerStyle={{ ...CMCommonStyles.buttonMain, flex: 1 }}
              onPress={onBtnCreateMatch}
            >
              <Text style={CMCommonStyles.buttonMainText}>
                {route.params.isEdit ? 'Update Match' : 'Create Match'}
              </Text>
            </CMRipple>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default CMEditMatchScreen;
