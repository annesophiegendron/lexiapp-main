import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const DeleteConfirmationModal = ({isVisible, onClose, onDelete}) => {
  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Delete Word</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to delete this word from your lexicon?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#f7f7f9',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D0D0D',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#242540',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#e63946',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#D7D7D9',
    borderWidth: 2,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#0D0D0D',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default DeleteConfirmationModal;
