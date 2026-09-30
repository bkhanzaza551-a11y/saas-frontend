import sys

with open('src/pages/storefront/CheckoutPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('for (const booking of bookings)')
end = content.find('clearBookings()')

old = content[start:end]

new = """for (const booking of bookings) {
        for (let i = 0; i < (booking.qty || 1); i++) {
          const startAtDate = new Date(`${booking.date}T${booking.time}:00`);
          const endAtDate = new Date(startAtDate.getTime() + 60 * 60 * 1000); // 1 hour
          const bId = booking.branchId || salon?.branches?.[0]?.id;
          if (!bId) throw new Error("No active branch found for booking. Please select a valid branch or contact salon.");

          const payload = {
            customerName,
            customerPhone: formattedPhone,
            customerEmail: form.email ? form.email.trim() : undefined,
            primaryStaffUserId: booking.staffId || null,
            branchId: bId,
            notes: form.note ? form.note.trim() : undefined,
            startAt: startAtDate.toISOString(),
            endAt: endAtDate.toISOString(),
            items: [{
              serviceId: booking.serviceId || booking.id,
              staffUserId: booking.staffId || null,
              startAt: startAtDate.toISOString(),
              endAt: endAtDate.toISOString()
            }],
            // For backward compatibility:
            serviceId: booking.serviceId || booking.id,
            preferredDate: booking.date,
            preferredTime: booking.time,
            staffId: booking.staffId || null,
            note: form.note ? form.note.trim() : undefined,
            paymentMode: form.paymentMode,
            couponCode: couponDiscount > 0 ? couponCode.trim() : undefined
          };
          const res = await api.post(`/public/salons/${salon.slug}/book`, payload);
          results.push(res.data);
        }
      }

      """

content = content[:start] + new + content[end:]
with open('src/pages/storefront/CheckoutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced successfully")
