import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '@/constants/theme';

export function SearchBar(){
    return (
        <View style={styles.searchBar}>
            <Text style ={styles.searchBarText}>  
                Search
            </Text>
        </View>
    )
}
          
const styles = StyleSheet.create({
    searchBar: {
        flex: 1,
        backgroundColor : Colors.lightestBlue,
        borderWidth: 2,
        borderColor: 'grey',
        borderRadius: 10,
        height: 50,
        padding: 10,
        justifyContent: 'center'
      },
      searchBarText: {
        fontSize: 16,
      },
})