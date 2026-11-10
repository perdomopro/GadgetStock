package com.perdomazo.firstproject.Controllers;

import com.perdomazo.firstproject.Models.GadgetModel;
import com.perdomazo.firstproject.Services.GadgetService;
import com.perdomazo.firstproject.dto.FinancialSummaryDTO;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gadget")
@CrossOrigin(origins = "http://localhost:5173")
public class GadgetController {

    private final GadgetService gadgetService;

    public GadgetController(GadgetService gadgetService) {
        this.gadgetService = gadgetService;
    }

    @GetMapping
    public List<GadgetModel> getAllGadget() {
        return gadgetService.getAllGadget();
    }

    @GetMapping("/{id}")
    public ResponseEntity<GadgetModel> getGadgetById(@PathVariable Long id) {
        GadgetModel gadget = gadgetService.findById(id);
        return ResponseEntity.ok(gadget);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GadgetModel saveGadget(@Valid @RequestBody GadgetModel gadget) {
        return gadgetService.saveGadget(gadget);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public GadgetModel update(@PathVariable Long id, @Valid @RequestBody GadgetModel gadget) {
        return gadgetService.update(id, gadget);
    }

    @GetMapping("/find")
    public List<GadgetModel> findByName(@RequestParam(name = "name", required = false) String name) {
        return gadgetService.findByName(name);
    }

    @GetMapping("/total-spent")
    public Float totalSpent() {
        return gadgetService.calculateMoneySpent();
    }

    @GetMapping("/finance/summary")
    public FinancialSummaryDTO getFinancialSummary() {
        return gadgetService.getFinancialSummary();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        gadgetService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/delete/name/{name}")
    public ResponseEntity<Void> deleteByName(@PathVariable String name) {
        gadgetService.deleteByName(name);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/gadgets-sold")
    public List<GadgetModel> getAllSoldGadget() {
        return gadgetService.getAllSoldGadget();
    }
}
