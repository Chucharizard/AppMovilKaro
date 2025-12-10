import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function TimeSelector({ value, onChange, placeholder = 'Seleccionar hora' }) {
  const parse = (v) => {
    if (!v) return { h: 8, m: 0 };
    // Accept formats like HH:MM:SS, HH:MM, H:MM AM/PM
    const hh = v.match(/^(\d{1,2}):(\d{2})/);
    if (hh) return { h: Number(hh[1]), m: Number(hh[2]) };
    return { h: 8, m: 0 };
  };

  const [visible, setVisible] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    const p = parse(value);
    setHour(p.h);
    setMinute(p.m);
  }, [value]);

  const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);
  const formatted = () => `${fmt(hour)}:${fmt(minute)}:00`;

  const incHour = () => setHour((h) => (h + 1) % 24);
  const decHour = () => setHour((h) => (h + 23) % 24);
  const incMinute = () => setMinute((m) => (m + 5) % 60);
  const decMinute = () => setMinute((m) => (m + 55) % 60);

  const confirm = () => {
    const v = formatted();
    if (onChange) onChange(v);
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.button}>
        <Text style={styles.buttonText}>{value ? value.replace(':00','') : placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Seleccionar Hora</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity onPress={decHour} style={styles.spinBtn}><Text style={styles.spin}>-</Text></TouchableOpacity>
              <Text style={styles.timeText}>{fmt(hour)}</Text>
              <TouchableOpacity onPress={incHour} style={styles.spinBtn}><Text style={styles.spin}>+</Text></TouchableOpacity>
              <Text style={[styles.timeText, { marginLeft: 12 } ]}>:</Text>
              <TouchableOpacity onPress={decMinute} style={styles.spinBtn}><Text style={styles.spin}>-</Text></TouchableOpacity>
              <Text style={styles.timeText}>{fmt(minute)}</Text>
              <TouchableOpacity onPress={incMinute} style={styles.spinBtn}><Text style={styles.spin}>+</Text></TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.actionBtn}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirm} style={[styles.actionBtn, styles.primary]}><Text style={{ color: '#fff' }}>Aceptar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { padding: 10, borderRadius: 6, backgroundColor: '#f1f1f1' },
  buttonText: { color: '#111' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 300, padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  spinBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 6, marginHorizontal: 6 },
  spin: { fontSize: 18 },
  timeText: { fontSize: 20, minWidth: 40, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  actionBtn: { padding: 8, marginLeft: 8 },
  primary: { backgroundColor: '#007AFF', paddingHorizontal: 12, borderRadius: 6 },
});
